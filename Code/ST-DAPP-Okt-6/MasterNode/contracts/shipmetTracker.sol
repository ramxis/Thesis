pragma solidity ^0.4.25;
//pragma experimental ABIEncoderV2;//using expermental features check if it works correctly

library Helper {
    //helper library for post quantum cryptographic functions
    /*function decryptInt(string _cipherText,string _secretKey,string _seed) public constant returns (uint) {
        uint plainValue = _cipherText ^ uint(keccak256(_seed,_secretKey));
    }
    function decryptStr(string _cipherText,string _secretKey,string _seed) public constant returns (string plainText) {
        bytes32 Value = _cipherText ^ keccak256(_seed,_secretKey);
        string memory result = bytes32ToString(Value);
        return (result);
    }*/

    function decryptStr(string cyphertext,string key,string seed) public constant returns (string palinValue){
        bytes32 value = stringToBytes32(cyphertext) ^ (keccak256(key,seed));
        string memory result = bytes32ToString(value);
        return (result);
    }
      function decryptInt(uint cyphertext,string key,string seed) public constant returns (uint palinValue){
       uint value = cyphertext ^ uint(keccak256(key,seed));
       return value;
    }

    function VerifyDigitalSignature(bytes32 _signature,string _secretKey,string _seed) public constant returns(bool){

      bytes32 sig = keccak256(_seed,_secretKey);//coz signature is already the hashed value
      if(_signature==sig) {
        return (true);
      }
      else {
        return (false);
      }
    }


    function encrypt(uint input,string key,string seed) public constant returns (uint cyphertext){
        uint _cyphertext = input ^ uint(keccak256(seed,key));

        return (_cyphertext);

    }

    /*function getSeed(string arg1 , string arg2, string arg3, string arg4, string arg5) public constant returns(string) {
      string message = strConcat(arg1,arg2,arg3,arg4,arg5);
      string seed = keccak256(message);
      return seed;
    }*/

    // string operations

    function strConcat(string _a, string _b, string _c, string _d, string _e) public constant returns (string){
      bytes memory _ba = bytes(_a);
      bytes memory _bb = bytes(_b);
      bytes memory _bc = bytes(_c);
      bytes memory _bd = bytes(_d);
      bytes memory _be = bytes(_e);
      string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
      bytes memory babcde = bytes(abcde);
      uint k = 0;
      for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
      for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
      for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
      for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
      for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
      return string(babcde);
}

    function stringToBytes32(string memory source) returns (bytes32 result) {
      bytes memory tempEmptyStringTest = bytes(source);
      if (tempEmptyStringTest.length == 0) {
        return 0x0;
      }
      assembly {
        result := mload(add(source, 32))
      }
    }


    function bytes32ToString(bytes32 x) constant returns (string) {
      bytes memory bytesString = new bytes(32);
      uint charCount = 0;
      for (uint j = 0; j < 32; j++) {
          byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
          if (char != 0) {
              bytesString[charCount] = char;
              charCount++;
          }
      }
      bytes memory bytesStringTrimmed = new bytes(charCount);
      for (j = 0; j < charCount; j++) {
          bytesStringTrimmed[j] = bytesString[j];
      }
      return string(bytesStringTrimmed);
    }

    function uintToBytes(uint v) constant returns (bytes32 ret) {
     if (v == 0) {
         ret = '0';
     }
     else {
         while (v > 0) {
             ret = bytes32(uint(ret) / (2 ** 8));
             ret |= bytes32(((v % 10) + 48) * 2 ** (8 * 31));
             v /= 10;
         }
     }
     return ret;
 }

 function bytesToUInt(bytes32 v) constant returns (uint ret) {
     if (v == 0x0) {
         throw;
     }

     uint digit;

     for (uint i = 0; i < 32; i++) {
         digit = uint((uint(v) / (2 ** (8 * (31 - i)))) & 0xff);
         if (digit == 0) {
             break;
         }
         else if (digit < 48 || digit > 57) {
             throw;
         }
         ret *= 10;
         ret += (digit - 48);
     }
     return ret;
 }


}

contract ShipmentTracker {

    mapping (string => ShipmentData[]) trackingInfo;
    //dynamic mapping to keep track of tracking numbers
    mapping(string => TrackingNr) trackingNrList;
    address public owner;
    //dynamic array to keep track of authorized shippers and handlers

    //enum severity { Critical, High, Medium, Low }
    // struct to hold addresses of authorized shippers and devices
    struct Handler {
        address ethAddr;
        string name_id; //make sure on Master Node that shipper name is always unique as it will be the lookup for current shipper PQ key
        string pubKey; // for using with  PQ crypto
    }
    //struct to hold shipper and sensor data
    struct ShipmentData {
            address shipperAddr;
            string shipper_id;
            uint sensorData;
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
      uint minThreshold;
      uint maxThreshold; //this is the limit that should never be exceded e.g 50C temp
      bool minFlag; //flag to indicate weather minimum maxThreshold is relevent for a dataID/reqID
      bool maxFlag;  //flag to indicate weather minimum maxThreshold is relevent for a dataID/reqID
    }

    //struct to define trackingNrs
    struct TrackingNr {
      string value;
      bool isExists;
      string ipfsLogAddr;
    }



    //array to define Requirements/conditions
    //Requirements[] public RequirementsList;
    mapping(string => Requirements[]) RequirementsList;

    //array to hold all tracking numbers
    string[] private PkgNrList;

    mapping (string => Handler[]) handlerList;
    /*****************Events***************************************************/
    //Events are used for call back functions in js of our DAPP
    event AuthorizeAddressEvent(address,string);
    event LogRequirements(string _trackingNr,string _reqID,string _title,uint _severityLevel,uint _minThreshold,uint _maxThreshold,bool _minFlag,bool _maxFlag);
    event NewTrackingNumber(string trackingNr);
    event ShippingEvent(address _shipper,string _shipperID,uint _data,string _datatID,string _location,string _trackingNr,string _status,uint _blockNr,uint _timestamp);

    event ReqViolationEventMinMax(address _shAddr, string shipper_id, string _trackingNr,string _reqID,string _title,uint _severityLevel,uint _sensorData,string _violationLoc,uint _blkNr,uint _timeStamp);
    event ReqViolationEventMax(address _shAddr, string shipper_id, string _trackingNr,string _reqID,string _title,uint _severityLevel,uint _sensorData,string _violationLoc,uint _blkNr,uint _timeStamp);
    event ReqViolationEventMin(address _shAddr, string shipper_id, string _trackingNr,string _reqID,string _title,uint _severityLevel,uint _sensorData,string _violationLoc,uint _blkNr,uint _timeStamp);
    event AuthorizationError(string);

    modifier onlyAuthorized(string _trNr) {
        assert(IsAuthorized(msg.sender,_trNr)); //TODO:"add second error return message when it comes out of beta in next solidity build"assert(condition,'error message');
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }


    /*modifier onlyifSigMatch(uint data, string dataID, string location, string trackingNr, string _status, string _shipperID, string signature,string seed) {
      assert(verifySignature(data,dataID,location,trackingNr,_status,_shipperID,signature,seed));
      _;
    }*/
    modifier onlyifSigMatch(bytes32 signature,string seed,string _shipperID, string _trackingNr) { //signature,_seed,_shipperID,trackingNr
      assert(verifySignature(_shipperID,signature,seed,_trackingNr));
      _;
    }



    /**
      default constructor
    */
    constructor() public {
        owner = msg.sender;

    }

    /**
      Function: to check if device is allowed to interact with the contract
      Written by: Rameez
    */
    function IsAuthorized(address caller,string _trNr) internal returns(bool) {
        if (caller == owner) {
            return true;
        }
        else if (caller == address(this)) {
            return true;
        }
        else {
          // check if user is member of authorized list for a particular TrNr;
            uint size = handlerList[_trNr].length;
            for (uint i=0; i < size; i++) {
                if (caller == handlerList[_trNr][i].ethAddr) {
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
    function AuthorizeAddress(address ethAddress, string _shipperName, string pubPQKey, string _trackingNr) public onlyOwner {
        //handlerList.push(ethAddress);
        bool exists = chkDuplicate(ethAddress,pubPQKey,_trackingNr);
        /*if(exists==-1)
        {
          emit AuthorizationError("Address already Exists");
          revert("Address already Exists");
        }*/
        if(exists) {
          emit AuthorizationError("Duplicate Post Quantum Public Key detected / Public keys must be unique");
          revert("Duplicate Post Quantum Public Key detected / Public keys must be unique");
        }
        else {
          Handler memory handlerObj = Handler(ethAddress,_shipperName,pubPQKey);
          handlerList[_trackingNr].push(handlerObj);
          if(!chkTrackingNrExists(_trackingNr)) {
            addTrackingNumber(_trackingNr);
          }
          emit AuthorizeAddressEvent(ethAddress,_trackingNr);
          //TODO: return true to let web3 know address was authorized?
        }

    }

    /**
      Function: to delete devices from authorized list
      Written by: Rameez
      callebale by: only the contract publisher
      NOTE: this can potentially be a very expensive function in terms of gas and computation, and might in theory throw out of gas error in worst case
            how ever in any potential real scenarios a handler list for any trackingNr should be quite small at worst 10 to 12 so the theoratical situation should never occur.
    */
    function RevokeAuthorization(address ethAddress,string _trackingNr) public onlyOwner returns(bool) {
        uint index = IndexOf(ethAddress,_trackingNr);
        if(index>=0 && index<=handlerList[_trackingNr].length)
        {
          return RemoveByIndex(index,_trackingNr);
        }
        return false;


    }

    /**
      Function: to get the index of array where the value is stored
      Written by: Rameez
    */
    function IndexOf(address eth,string _trackingNr) internal returns(uint) {
      for (uint i=0;i<handlerList[_trackingNr].length;i++)
      {
        if (eth==handlerList[_trackingNr][i].ethAddr) {
            return i;
        }
      }
    }

    /**
      Function: check if eth address already exists in handler list
      Written by: Rameez
    */
    function chkDuplicate(address eth, string pubKey,string _trackingNr) internal returns(bool) {
      for (uint i=0;i<handlerList[_trackingNr].length;i++)
      {

        //NOTE:allowing multiple pq keys for single eth address, i.e. eth address is bound to a packgae and pq bound to shipper
        /*if (eth==handlerList[_trackingNr][i].ethAddr) {
            return -1;
        }*/

        if (keccak256(pubKey)==keccak256(handlerList[_trackingNr][i].pubKey)) {
            //return -2;
            return true;
        }
      }
      return false;
    }


    /**
      Function: remove the shipper from authorized handlerList
      Written by: Rameez
    */

    function RemoveByIndex(uint index,string _trackingNr) internal returns(bool) {
      if(index >= handlerList[_trackingNr].length) {
        return false;
      }
      for (uint i = index; i<handlerList[_trackingNr].length-1; i++)
      {
            handlerList[_trackingNr][i] = handlerList[_trackingNr][i+1];
      }
      handlerList[_trackingNr].length--;
      /*if(handlerList[_trackingNr].length==0) {
        removeTrackingNumber(_trackingNr);
      }*/
      return true;
    }



    /**
      Function: get requirements object
      //requirements will be documented in the requirements documents
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetRequirementObject(uint index,string _trackingNr) public constant onlyAuthorized(_trackingNr) returns(string _reqID,string _title,uint _severityLevel,uint _minThreshold,uint _maxThreshold,bool _minFlag,bool _maxFlag) {
      Requirements memory reqObject = RequirementsList[_trackingNr][index];
      return (reqObject.reqID,reqObject.title,reqObject.severityLevel,reqObject.minThreshold,reqObject.maxThreshold,reqObject.minFlag,reqObject.maxFlag);
    }

    /**
      Function: get requirements object
      //requirements will be documented in the requirements documents
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetReqListSize(string _trackingNr) public constant onlyAuthorized(_trackingNr) returns(uint) {
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
    function SetRequirements(string _trackingNr,string _reqID, string _requireTitle, uint _level, uint _minthreshold, uint _maxthreshold,bool _minFlag,bool _maxFlag) public onlyOwner {
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
                                               data.shipper_id,
                                              _trackingNr,
                                              data.dataID,
                                              reqObject.title,
                                              reqObject.severityLevel,
                                              data.sensorData,
                                              data.currentLocation,
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
                                            data.shipper_id,
                                            _trackingNr,
                                            data.dataID,
                                            reqObject.title,
                                            reqObject.severityLevel,
                                            data.sensorData,
                                            data.currentLocation,
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
                                          data.shipper_id,
                                          _trackingNr,
                                          data.dataID,
                                          reqObject.title,
                                          reqObject.severityLevel,
                                          data.sensorData,
                                          data.currentLocation,
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
    function chkViolationBytrackingNr(string _trackingNr) public onlyAuthorized(_trackingNr) {
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
                                               data.shipper_id,
                                              _trackingNr,
                                              data.dataID,
                                              reqObject.title,
                                              reqObject.severityLevel,
                                              data.sensorData,
                                              data.currentLocation,
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
                                            data.shipper_id,
                                            _trackingNr,
                                            data.dataID,
                                            reqObject.title,
                                            reqObject.severityLevel,
                                            data.sensorData,
                                            data.currentLocation,
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
                                          data.shipper_id,
                                          _trackingNr,
                                          data.dataID,
                                          reqObject.title,
                                          reqObject.severityLevel,
                                          data.sensorData,
                                          data.currentLocation,
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
    //TODO:comment this part and related code out for testing on ropsten so gas limit on ropsten doesnt exceed
    function chkViolationByID(string _reqID) public onlyOwner {

      for(uint i=0;i<PkgNrList.length;i++) {

        string memory _trNr = PkgNrList[i];
        uint size = GetLogSize(_trNr);
        for(uint j=0;j<size;j++) {
          ShipmentData memory data = trackingInfo[_trNr][j];
          if(keccak256(data.dataID)==keccak256(_reqID)) {
            ChkViolations(data,_trNr);
          }
          //cannot use block.timestamp as miners are allowed to modify it by +- 900 secs
        }
        //cannot use block.timestamp as miners are allowed to modify it by +- 900 secs
      }

    }


    /**
      Function: Log Tracking information
      This can be violations sent to block chain or shipper change events i.e when second shipper takes constrol of pkg from first shipper etc
      Written by: Rameez
      callebale by: only authorized handlers
      //NOTE:-shipperID and trackingNr are unencrypted as they are keys in look up tables
    */

    /*function LogTrackingInformation(uint data, string dataID, string location, string trackingNr, string _status, string _shipperID, bytes32 signature, string _seed)
    public onlyAuthorized(trackingNr) onlyifSigMatch(signature,_seed,_shipperID,trackingNr) {
        if(!chkTrackingNrExists(trackingNr)) {
          addTrackingNumber(trackingNr);
        }
        ShipmentData memory trackingData = getTrackingData(data,dataID,location,trackingNr,_status,_shipperID,_seed);
        //ShipmentData memory trackingData = getTrackingData(data,dataID,location,trackingNr,_status,_shipperID,signature,_seed);
        trackingInfo[trackingNr].push(trackingData);
        ChkViolations(trackingData,trackingNr);
        emit ShippingEvent(msg.sender,data,dataID,location,trackingNr,_status,block.number,block.timestamp);

    }*/
    //TODO:add only if signature match
    function LogTrackingViolations(uint data, string dataID, string location, string trackingNr, string _status, string _shipperID, bytes32 signature, string _seed)
    public onlyAuthorized(trackingNr) {
        if(!chkTrackingNrExists(trackingNr)) {
          addTrackingNumber(trackingNr);
        }
        ShipmentData memory trackingData = decryptTrackingData(data,dataID,location,trackingNr,_status,_shipperID,_seed);
        //ShipmentData memory trackingData = getTrackingData(data,dataID,location,trackingNr,_status,_shipperID,signature,_seed);
        trackingInfo[trackingNr].push(trackingData);
        ChkViolations(trackingData,trackingNr);
        //TODO:the shippingevent should be emitted with decrypted args in the final version: i.e trackingData.data,trackingData.dataID
        emit ShippingEvent(msg.sender,_shipperID,data,dataID,location,trackingNr,_status,block.number,block.timestamp);

    }

    function decryptTrackingData(uint data, string dataID, string location, string trackingNr, string _status, string _shipperID, string _seed) internal returns(ShipmentData d) {

        //sanitize dataID from client side to be always the same as reqID
        string memory _secretKey = getShipperPQKey(trackingNr,_shipperID);
        //check the commented out code: it works
        /*uint _data = Helper.decryptInt(data,_secretKey,_seed);
        string memory _dataID = Helper.decryptStr(dataID,_secretKey,_seed);
        string memory _location = Helper.decryptStr(location,_secretKey,_seed);
        string memory __status = Helper.decryptStr(_status,_secretKey,_seed);
        ShipmentData memory _trackingData = ShipmentData(msg.sender,_data,_dataID,_location,__status,block.number,block.timestamp);*/
        ShipmentData memory _trackingData = ShipmentData(msg.sender,_shipperID,data,dataID,location,_status,block.number,block.timestamp);
        return _trackingData; //only return was missing which was causing the errors in the previous version

    }

    //TODO:removed 1
    /*function LogTrackingInformation(uint data, string dataID, string location, string trackingNr, string _status) public onlyAuthorized(trackingNr)  {
      if(!chkTrackingNrExists(trackingNr)) {
        addTrackingNumber(trackingNr);
      }
      //sanitize dataID from client side to be always the same as reqID
      ShipmentData memory trackingData = ShipmentData(msg.sender,data,dataID,location,_status,block.number,block.timestamp);
      trackingInfo[trackingNr].push(trackingData);
      //trackingInfo[trackingNr].push(ShipmentData(msg.sender,data,dataID,location,block.number,block.timestamp));
      ChkViolations(trackingData,trackingNr);
      emit ShippingEvent(msg.sender,data,dataID,location,trackingNr,_status,block.number,block.timestamp);

    }*/
     function LogTrackingInformationNew(uint data, string dataID, string location, string trackingNr, string _status, string _shipperID, string signature, string _seed) public onlyAuthorized(trackingNr) {
          if(!chkTrackingNrExists(trackingNr)) {
          addTrackingNumber(trackingNr);
        }
        ShipmentData memory trackingData = decryptTrackingData(data,dataID,location,trackingNr,_status,_shipperID,_seed);
        //ShipmentData memory trackingData = getTrackingData(data,dataID,location,trackingNr,_status,_shipperID,signature,_seed);
        trackingInfo[trackingNr].push(trackingData);
        ChkViolations(trackingData,trackingNr);
        //TODO:the shippingevent should be emitted with decrypted args in the final version: i.e trackingData.data,trackingData.dataID

    }

    /**
      Function: get Tracking information length
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetLogSize(string trackingNr) public constant onlyAuthorized(trackingNr) returns(uint) {
      return trackingInfo[trackingNr].length;
    }

    /**
      Function: get logged data
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetLoggedData(uint index,string trackingNr) public constant onlyAuthorized(trackingNr) returns(address _shAddress,string _shipperID,uint _sensorData,string _dataID,string _location,string _status,uint _blkNr,uint _timeStamp) {
      if (trackingInfo[trackingNr].length==0) {
        return;
      }
      ShipmentData memory data = trackingInfo[trackingNr][index];
      return (data.shipperAddr,data.shipper_id,data.sensorData,data.dataID,data.currentLocation,data.status,data.dataBlockNr,data.dataTimestamp);
    }



    /**
      Function: Function to get number of authorized handlers
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function getHandlerListlength(string trackingNr) public constant onlyAuthorized(trackingNr) returns(uint) {
      return handlerList[trackingNr].length;
    }
    /**
      Function: Function to get list of authorized handlers
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function getHandlerList(uint index,string trackingNr) public constant onlyAuthorized(trackingNr) returns(address _shaddress,string _name,string _pubkey) {
      //log("the user with the following address is authorized",msg.sender);
      return (handlerList[trackingNr][index].ethAddr,handlerList[trackingNr][index].name_id,handlerList[trackingNr][index].pubKey);
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
    Function: Function remove tracking Nr
    Written by: Rameez
    callebale by: only authorized handlers
  */
  function removeTrackingNumber(string _trackingNr) internal returns(bool success) {
    require(chkTrackingNrExists(_trackingNr));
    trackingNrList[_trackingNr].value = '0';
    trackingNrList[_trackingNr].isExists = false;
    //removeFromPkgNrList(_trackingNr);
    return true;
  }

  function removeFromPkgNrList(string _trackingNr) internal returns(bool success) {
    for (uint i = 0; i<PkgNrList.length-1; i++)
    {
          PkgNrList[i] = PkgNrList[i+1];
    }
    PkgNrList.length--;
    return true;
  }

  /**
    Function: Function get all trackingNrs
    Written by: Rameez
    callebale by: only authorized handlers
  */
  function getAllPkgNrs(uint index) public constant onlyOwner returns(string) {
    if(trackingNrList[PkgNrList[index]].isExists) {
      return PkgNrList[index];
    }
    //return PkgNrList[index];
  }

  function getPkgNrListSize() public constant onlyOwner returns(uint size) {
    return PkgNrList.length;
  }

  function setIpfsAddress(string _ipfsHash,string _trackingNr) public onlyAuthorized(_trackingNr) returns(bool) {
    require(trackingNrList[_trackingNr].isExists);
    trackingNrList[_trackingNr].ipfsLogAddr=_ipfsHash;
    return true;
  }

  function getIpfsAddress(string _trackingNr) public constant onlyAuthorized(_trackingNr) returns(string) {
    return trackingNrList[_trackingNr].ipfsLogAddr;
  }

  /**
    Function: verify Post quantum Signature for each function call
    Written by: Rameez
  */
  function verifySignature(string _shipperID, bytes32 signature,string _seed, string _trackingNr) internal returns(bool) {
    string memory _pqKey = getShipperPQKey(_trackingNr,_shipperID);
    //string _seed = Helper.getSeed(data,dataID,location,_status,_shipperID);
    //string _cipherText = Helper.
    bool verifySig = Helper.VerifyDigitalSignature(signature,_pqKey,_seed);
    return verifySig;//TODO:removed

  }

  function getShipperPQKey(string _trackingNr, string _shipperID) internal returns (string) {
    uint size = getHandlerListlength(_trackingNr);
    for(uint index=0;index<size;index++) {
      if(keccak256(handlerList[_trackingNr][index].name_id) == keccak256(_shipperID)) {
        return handlerList[_trackingNr][index].pubKey;
      }
    }
  }
  /**
    Function: PQ decryption function
    Written by: Rameez
  */
/*function decrypt(string _trackingNr, string _shipperID, string _cipherText, string _seed) internal returns(uint){
    //decryption function
    string memory _pqKey = getShipperPQKey(_trackingNr,_shipperID);
    uint plainText = Helper.decryptInt(_pqKey,_cipherText,_seed);
    return plainText;
  }*/

  /*function a() constant returns (address) {
        return Helper.a();
    }*/


}
