pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;//using expermental features check if it works correctly

contract ShipmentTracker {
    mapping (address => Handler) handlers;
    address owner;
    //dynamic array to keep track of authorized shippers and handlers
    address[] public handlerList;
    //enum severity { Critical, High, Medium, Low }
    // struct to hold addresses of authorized shippers and devices
    struct Handler {
        address ethAddr;
        string name;
        bytes32 pubKey; // for using with  PQ crypto
    }
    //struct to hold shipper and sensor data
    struct SensorData {
            address shipperAddr;
            uint data;
            string dataID;
    }

    //Struct to define requirements/condtions
    struct Requirements {
      string RID;
      string title;
      uint severityLevel;//4,3,2,1 for critical to low
      uint threshold; //this is the limit that should never be exceded e.g 50C temp
    }


    //array to hold data sent by shippers
    SensorData[] public SensorDataList;

    //array to define Requirements/conditions
    Requirements[] public RequirementsList;

    /*****************Events***************************************************/
    //Events are used for call back functions in js of our DAPP
    event LogAddress(string, address);
    event LogHandlerList(address[] handlerList);
    event LogRequirementList(Requirements[] RequirementsList);

    modifier onlyAuthorized {
        assert(IsAuthorized(msg.sender));
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
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
                if (caller == handlerList[i]) {
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
    function AuthorizeAddress(address ethAddress) public onlyOwner {
        handlerList.push(ethAddress);
    }

    /**
      Function: to remove devices from authorized list
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
        if (eth==handlerList[i]) {
            return i;
        }
      }
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
      Function: get all conditons
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetRequirementsList() public onlyAuthorized returns(Requirements[] array) {
      if (RequirementsList.length==0) {
        return;
      }
      emit LogRequirementList(RequirementsList);
      return RequirementsList;
    }

    /**
      Function: set condtions
      Written by: Rameez
      callebale by: only the contract publisher
    */
    function SetRequirements(string requireID, string requireTitle, uint level, uint threshold) public onlyOwner {
      RequirementsList.push(Requirements(requireID, requireTitle, level, threshold));
    }

    /**
      Function: Log SensorData
      Written by: Rameez
      callebale by: only authorized handlers
    */

    function LogSensorData(address shipperAddress, uint data, string dataID) public onlyAuthorized {
      SensorDataList.push(SensorData(shipperAddress,data,dataID));

    }

    /**
      Function: get logged data
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function GetLoggedData() public onlyAuthorized returns(SensorData[] array) {
      if (SensorDataList.length==0) {
        return;
      }
      return SensorDataList;
    }

    /**
      Function: Function to get list of authorized handlers
      Written by: Rameez
      callebale by: only authorized handlers
    */
    function getHandlerList() public onlyAuthorized {
      //log("the user with the following address is authorized",msg.sender);
      emit LogHandlerList(handlerList);

    }



    /*function log(string s , address x) internal {
      emit LogAddress(s, x); // necessary for displaying log
    }*/


}
