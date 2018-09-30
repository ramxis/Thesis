pragma solidity ^0.4.24;
//pragma experimental ABIEncoderV2;//using expermental features check if it works correctly

contract ShipmentTracker {
    mapping (address => Handler) handlers;
    mapping (string => ShipmentData[]) trackingInfo;
    //dynamic mapping to keep track of tracking numbers
    mapping(string => TrackingNr) trackingNrList;
    address owner;
    //dynamic array to keep track of authorized shippers and handlers



    //enum severity { Critical, High, Medium, Low }
    // struct to hold addresses of authorized shippers and devices
    struct Handler {
        address ethAddr;
        string name;
        string pubKey; // for using with  PQ crypto
    }
    //struct to hold shipper and sensor data
    struct ShipmentData {
            address shipperAddr;
            int sensorData;
            string dataID;
            string currentLocation;
            string status;
            uint dataBlockNr;
            uint dataTimestamp;
    }

    //Struct to define requirements/condtions
    struct Requirements {
      string reqID;
      string title;
      uint severityLevel;//4,3,2,1 for critical to low
      int minThreshold;
      int maxThreshold; //this is the limit that should never be exceded e.g 50C temp
      bool minFlag; //flag to indicate weather minimum maxThreshold is relevent for a dataID/reqID
      bool maxFlag;  //flag to indicate weather minimum maxThreshold is relevent for a dataID/reqID
    }

    //struct to define trackingNrs
    struct TrackingNr {
      string value;
      bool isExists;
    }

    /*struct ReqStorage {
      address shipperAddr;
      string  trackingNr;
      string  ID;
      string  title;
      uint    sevLevel;
      int     Value;
      string  Loc;
      string  status;
      int     minThreshold;
      int     maxThreshold;
      uint    dataBlockNr;
      uint    dataTimestamp;
    }*/

    //array to define Requirements/conditions
    //Requirements[] public RequirementsList;
    mapping(string => Requirements[]) RequirementsList;

    //array to hold all tracking numbers
    string[] private PkgNrList;

    //requirements should be set only Once at the start of the shipment cycle
    bool private acceptReqChanges;

    Handler[] private handlerList;
    /*****************Events***************************************************/
    //Events are used for call back functions in js of our DAPP
    event AuthorizeAddressEvent(address);
    event LogRequirements(string _trackingNr,string _reqID,string _title,uint _severityLevel,int _minThreshold,int _maxThreshold,bool _minFlag,bool _maxFlag);
    event NewTrackingNumber(string trackingNr);
    event ShippingEvent(address _shipper,int _data,string _datatID,string _location,string _trackingNr,string _status,uint _blockNr,uint _timestamp);

    event ReqViolationEventMinMax(address _shAddr, string _trackingNr,string _reqID,string _title,uint _severityLevel,int _sensorData,string _violationLoc,int _minThreshold,int _maxThreshold,uint _blkNr,uint _timeStamp);
    event ReqViolationEventMax(address _shAddr, string _trackingNr,string _reqID,string _title,uint _severityLevel,int _sensorData,string _violationLoc,int _maxThreshold,uint _blkNr,uint _timeStamp);
    event ReqViolationEventMin(address _shAddr, string _trackingNr,string _reqID,string _title,uint _severityLevel,int _sensorData,string _violationLoc,int _minThreshold,uint _blkNr,uint _timeStamp);
    event AuthorizationError(string);

    modifier onlyAuthorized {
        assert(IsAuthorized(msg.sender)); //TODO:"add second error return message when it comes out of beta in next solidity build"assert(condition,'error message');
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }


    modifier onlyifSigMatch(address ethAddr, string message, bytes32 signature) {
      assert(verifyDigitalSignature(ethAddr,message,signature));
      _;
    }



    /**
      default constructor
    */
    function ShipmentTracker() public {
        owner = msg.sender;

    }

    /**
      Function: to check if device is allowed to interact with the contract
      Written by: Rameez
    */
    function IsAuthorized(address caller) internal returns(bool) {
        if (caller == owner) {
            return true;
        }
        else if (caller == address(this)) {
            return true;
        }
        else {
          // check if user is member of authorized list
            uint size = handlerList.length;
            for (uint i=0; i < size; i++) {
                if (caller == handlerList[i].ethAddr) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
      Function: to add devices to authorized list
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function AuthorizeAddress(address ethAddress, string _shipperName, string pubPQKey) public onlyOwner {
        //handlerList.push(ethAddress);
        int index = chkDuplicate(ethAddress,pubPQKey);
        if(index==-1)
        {
          emit AuthorizationError("Address already Exists");
          revert("Address already Exists");
        }
        else if(index==-2) {
          emit AuthorizationError("Duplicate Post Quantum Public Key detected / Public keys must be unique");
          revert("Duplicate Post Quantum Public Key detected / Public keys must be unique");
        }
        else {
          Handler memory handlerObj = Handler(ethAddress,_shipperName,pubPQKey);
          handlerList.push(handlerObj);
          emit AuthorizeAddressEvent(ethAddress);
          //TODO: return true to let web3 know address was authorized?
        }

    }

    /**
      Function: to delete devices from authorized list
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function RevokeAuthorization(address ethAddress) public onlyOwner returns(bool) {
        uint index = IndexOf(ethAddress);
        if(index>=0 && index<=handlerList.length)
        {
          return RemoveByIndex(index);
        }
        return false;


    }

    /**
      Function: to get the index of array where the value is stored
      Written by: Rameez
    */
    function IndexOf(address eth) internal returns(uint) {
      for (uint i=0;i<handlerList.length;i++)
      {
        if (eth==handlerList[i].ethAddr) {
            return i;
        }
      }
    }

    /**
      Function: check if eth address already exists in handler list
      Written by: Rameez
    */
    function chkDuplicate(address eth, string pubKey) internal returns(int) {
      for (uint i=0;i<handlerList.length;i++)
      {
        if (eth==handlerList[i].ethAddr) {
            return -1;
        }

        if (keccak256(pubKey)==keccak256(handlerList[i].pubKey)) {
            return -2;
        }
      }
      return 0;
    }


    /**
      Function: remove the shipper from authorized handlerList
      Written by: Rameez
    */

    function RemoveByIndex(uint index) internal returns(bool) {
      if(index >= handlerList.length) {
        return false;
      }
      for (uint i = index; i<handlerList.length-1; i++)
      {
            handlerList[i] = handlerList[i+1];
      }
      handlerList.length--;
      return true;
    }



    /**
      Function: get requirements object
      //requirements will be documented in the requirements documents
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetRequirementObject(uint index,string _trackingNr) public constant onlyAuthorized returns(string _reqID,string _title,uint _severityLevel,int _minThreshold,int _maxThreshold,bool _minFlag,bool _maxFlag) {
      Requirements reqObject = RequirementsList[_trackingNr][index];
      return (reqObject.reqID,reqObject.title,reqObject.severityLevel,reqObject.minThreshold,reqObject.maxThreshold,reqObject.minFlag,reqObject.maxFlag);
    }

    /**
      Function: get requirements object
      //requirements will be documented in the requirements documents
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetReqListSize(string _trackingNr) public constant onlyAuthorized returns(uint) {
      return RequirementsList[_trackingNr].length;
    }


    /*function ChkIntOverFlow(uint index) internal {
     int _index = int(index);
     assert(_index >= 0);//"index cannot be less than 0"
     //assert(_index <= 2**256 - 1);//unit256 should be between 0 and 2^256
   }*/


    /**
      Function: set condtions
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function SetRequirements(string _trackingNr,string _reqID, string _requireTitle, uint _level, int _minthreshold, int _maxthreshold,bool _minFlag,bool _maxFlag) public onlyOwner {
      require((_level>=1)&&(_level<=4));
      //RequirementsList.push(Requirements(_dataID, _requireTitle, _level, _minthreshold,_maxthreshold));
      Requirements memory reqObj = Requirements(_reqID,_requireTitle,_level,_minthreshold,_maxthreshold,_minFlag,_maxFlag);
      RequirementsList[_trackingNr].push(reqObj);
      emit LogRequirements(_trackingNr,_reqID,_requireTitle,_level,_minthreshold, _maxthreshold,_minFlag,_maxFlag);
    }

    /**
      Function: check for all violations associated to a particular tracking Nr
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function ChkViolations(ShipmentData data,string _trackingNr) internal {
        //if(keccak256(data.dataID)==keccak256(RequirementsList[data.dataID].reqID)) {
          //solidity cannot directly compare two strings hence we compare their hashes
          for (uint i = 0;i<GetReqListSize(_trackingNr);i++) {
            Requirements memory reqObject = RequirementsList[_trackingNr][i];
            if(keccak256(data.dataID)==keccak256(reqObject.reqID)) {
              if((reqObject.minFlag)&&(reqObject.maxFlag)) {
                if((reqObject.minThreshold<data.sensorData)&&(data.sensorData<reqObject.maxThreshold)) {
                  return;//_;
                }
                else {
                  emit ReqViolationEventMinMax(data.shipperAddr,
                                              _trackingNr,
                                              data.dataID,
                                              reqObject.title,
                                              reqObject.severityLevel,
                                              data.sensorData,
                                              data.currentLocation,
                                              reqObject.minThreshold,
                                              reqObject.maxThreshold,
                                              data.dataBlockNr,
                                              data.dataTimestamp);
                }
              }
              else if((!reqObject.minFlag)&&(reqObject.maxFlag)){
                if(data.sensorData<reqObject.maxThreshold) {
                  return;//_;
                }
                else {
                  emit ReqViolationEventMax(data.shipperAddr,
                                            _trackingNr,
                                            data.dataID,
                                            reqObject.title,
                                            reqObject.severityLevel,
                                            data.sensorData,
                                            data.currentLocation,
                                            reqObject.maxThreshold,
                                            data.dataBlockNr,
                                            data.dataTimestamp);
                }
              }
            else if((reqObject.minFlag)&&(!reqObject.maxFlag)) {
              if(data.sensorData>reqObject.minThreshold) {
                return;//_;
              }
              else {
                emit ReqViolationEventMin(data.shipperAddr,
                                          _trackingNr,
                                          data.dataID,
                                          reqObject.title,
                                          reqObject.severityLevel,
                                          data.sensorData,
                                          data.currentLocation,
                                          reqObject.minThreshold,
                                          data.dataBlockNr,
                                          data.dataTimestamp);
              }

            }
        }
      }

      //}

    }



    /**
      Function: emit violation when data is added to blockchain
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function chkViolationBytrackingNr(string _trackingNr) public onlyAuthorized {
      for(uint i=0;i<GetLogSize(_trackingNr);i++) {
        ShipmentData memory data = trackingInfo[_trackingNr][i];
        ChkViolationsTrNr(data,_trackingNr);
        //cannot use block.timestamp as miners are allowed to modify it by +- 900 secs
        //emit RequirementViolated("tarckingNR",_dataID,"temp",i,block.number,10*i);
      }

    }

    /**
      Function: check for all violations associated to a particular tracking Nr
      Written by: Rameez
      callebale by: internal

      this function should not be used unless no other choice
    */
    function ChkViolationsTrNr(ShipmentData data,string _trackingNr) internal {
        //if(keccak256(data.dataID)==keccak256(RequirementsList[data.dataID].reqID)) {
          //solidity cannot directly compare two strings hence we compare their hashes
          for (uint i = 0;i<GetReqListSize(_trackingNr);i++) {
            Requirements memory reqObject = RequirementsList[_trackingNr][i];
            if(keccak256(data.dataID)==keccak256(reqObject.reqID)) {
              if((reqObject.minFlag)&&(reqObject.maxFlag)) {
                if((reqObject.minThreshold<data.sensorData)&&(data.sensorData<reqObject.maxThreshold)) {
                  return;//_;
                }
                else {
                  emit ReqViolationEventMinMax(data.shipperAddr,
                                              _trackingNr,
                                              data.dataID,
                                              reqObject.title,
                                              reqObject.severityLevel,
                                              data.sensorData,
                                              data.currentLocation,
                                              reqObject.minThreshold,
                                              reqObject.maxThreshold,
                                              data.dataBlockNr,
                                              data.dataTimestamp);
                }
              }
              else if((!reqObject.minFlag)&&(reqObject.maxFlag)){
                if(data.sensorData<reqObject.maxThreshold) {
                  return;//_;
                }
                else {
                  emit ReqViolationEventMax(data.shipperAddr,
                                            _trackingNr,
                                            data.dataID,
                                            reqObject.title,
                                            reqObject.severityLevel,
                                            data.sensorData,
                                            data.currentLocation,
                                            reqObject.maxThreshold,
                                            data.dataBlockNr,
                                            data.dataTimestamp);
                }
              }
            else if((reqObject.minFlag)&&(!reqObject.maxFlag)) {
              if(data.sensorData>reqObject.minThreshold) {
                return;//_;
              }
              else {
                emit ReqViolationEventMin(data.shipperAddr,
                                          _trackingNr,
                                          data.dataID,
                                          reqObject.title,
                                          reqObject.severityLevel,
                                          data.sensorData,
                                          data.currentLocation,
                                          reqObject.minThreshold,
                                          data.dataBlockNr,
                                          data.dataTimestamp);
              }

            }
        }
      }

      //}

    }

    /**
      Function: emit violation when data is added to blockchain
      Written by: Rameez
      callebale by: only the contract publisher
    */
    //TODO:find and remove infinite loop in this function or find out why this is giving gas estimation error
    /*function chkViolationByID(string _reqID) constant public onlyAuthorized {

      for(uint i=0;i<PkgNrList.length;i++) {

        string memory _trNr = PkgNrList[i];

        for(uint j=0;j<trackingInfo[_trNr].length;j++) {
          ShipmentData data = trackingInfo[_trNr][j];
          if(keccak256(data.dataID)==keccak256(_reqID)) {
            ChkViolations(data,_trNr);
          }
          //cannot use block.timestamp as miners are allowed to modify it by +- 900 secs
        }
        //cannot use block.timestamp as miners are allowed to modify it by +- 900 secs
      }

    }*/


    /**
      Function: Log Tracking information
      This can be violations sent to block chain or shipper change events i.e when second shipper takes constrol of pkg from first shipper etc
      Written by: Rameez
      callebale by: only authorized handlers
    */

    function LogTrackingInformation(int data, string dataID, string location, string trackingNr, string _status, string message, bytes32 signature) public onlyAuthorized onlyifSigMatch(msg.sender,message,signature) {
        if(!chkTrackingNrExists(trackingNr)) {
          addTrackingNumber(trackingNr);
        }
        //sanitize dataID from client side to be always the same as reqID
        ShipmentData memory trackingData = ShipmentData(msg.sender,data,dataID,location,_status,block.number,block.timestamp);
        trackingInfo[trackingNr].push(trackingData);
        //trackingInfo[trackingNr].push(ShipmentData(msg.sender,data,dataID,location,block.number,block.timestamp));
        ChkViolations(trackingData,trackingNr);
        emit ShippingEvent(msg.sender,data,dataID,location,trackingNr,_status,block.number,block.timestamp);

    }

    //TODO:removed 1
    function LogTrackingInformation(int data, string dataID, string location, string trackingNr, string _status) public onlyAuthorized  {
      if(!chkTrackingNrExists(trackingNr)) {
        addTrackingNumber(trackingNr);
      }
      //sanitize dataID from client side to be always the same as reqID
      ShipmentData memory trackingData = ShipmentData(msg.sender,data,dataID,location,_status,block.number,block.timestamp);
      trackingInfo[trackingNr].push(trackingData);
      //trackingInfo[trackingNr].push(ShipmentData(msg.sender,data,dataID,location,block.number,block.timestamp));
      ChkViolations(trackingData,trackingNr);
      emit ShippingEvent(msg.sender,data,dataID,location,trackingNr,_status,block.number,block.timestamp);

    }

    /**
      Function: get Tracking information length
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetLogSize(string trackingNr) public constant onlyAuthorized returns(uint) {
      return trackingInfo[trackingNr].length;
    }

    /**
      Function: get logged data
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetLoggedData(uint index,string trackingNr) public constant onlyAuthorized returns(address _shAddress,int _sensorData,string _dataID,string _location,string _status,uint _blkNr,uint _timeStamp) {
      if (trackingInfo[trackingNr].length==0) {
        return;
      }
      ShipmentData data = trackingInfo[trackingNr][index];
      return (data.shipperAddr,data.sensorData,data.dataID,data.currentLocation,data.status,data.dataBlockNr,data.dataTimestamp);
    }



    /**
      Function: Function to get number of authorized handlers
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function getHandlerListlength() public constant onlyAuthorized returns(uint) {
      return handlerList.length;
    }
    /**
      Function: Function to get list of authorized handlers
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function getHandlerList(uint index) public constant onlyAuthorized returns(address _shaddress,string _name,string _pubkey) {
      //log("the user with the following address is authorized",msg.sender);
      return (handlerList[index].ethAddr,handlerList[index].name,handlerList[index].pubKey);
      //emit LogHandlerList(handlerList);

    }

    /**
      Function: Function to avoid duplicate trackingNrs
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function chkTrackingNrExists(string _nr) internal view returns(bool _isExists) {
    return trackingNrList[_nr].isExists;
  }

  /**
    Function: Function add tracking Nr
    Written by: Rameez
    callebale by: only authorized handlers
  */
  function addTrackingNumber(string _trackingNr) internal returns(bool success) {
    require(!chkTrackingNrExists(_trackingNr));
    trackingNrList[_trackingNr].value = _trackingNr;
    trackingNrList[_trackingNr].isExists = true;
    PkgNrList.push(_trackingNr);
    emit NewTrackingNumber(_trackingNr); // check if it can emit
    return true;
  }

  /**
    Function: Function get all trackingNrs
    Written by: Rameez
    callebale by: only authorized handlers
  */
  function getAllPkgNrs(uint index) public constant onlyAuthorized returns(string) {
    return PkgNrList[index];
  }

  function getPkgNrListSize() public constant onlyAuthorized returns(uint size) {
    return PkgNrList.length;
  }

  /**
    Function: verify Post quantum Signature for each function call
    Written by: Rameez
  */
  function verifyDigitalSignature(address shipperEthAdd, string message, bytes32 signature) internal returns(bool) {
    uint index = IndexOf(shipperEthAdd);
    string key = handlerList[index].pubKey; //TODO: use the PQ key
    bytes32 msgDigest = sha3(message); // solidity uses keccak256 implemenation of sha3
    bytes32 recDigest = decrypt(signature,key);
    if(msgDigest==recDigest) {
      return true;
    }

    return false;
  }
  /**
    Function: PQ decryption function
    Written by: Rameez
  */
  function decrypt(bytes32 cipherText, string pubKey) internal returns(bytes32){
    //decryption function
    bytes32 plainText = cipherText;//apply decrytion algo when PQ algo received

    return plainText;
  }



}