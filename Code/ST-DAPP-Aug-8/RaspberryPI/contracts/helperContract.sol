pragma solidity ^0.4.0;
contract Helper {



    function encryptionStrOld(string input) public constant returns (string _intOutput){
        /*bytes32 output = keccak256(input);
        uint intOutput = uint(keccak256(input));
        return (intOutput,output);*/

    }

    function getSeedKEy(string key,string seed) public constant returns(string _key,string _seed) {
        string memory _k = bytes32ToString(keccak256(key));
        string memory _s = bytes32ToString(keccak256(seed));
        return(_k,_s);
    }

    function encryptionint(uint input,string key,string seed) public constant returns (uint cyphertext){
        uint _cyphertext = input ^ uint(keccak256(key,seed));

        return (_cyphertext);
    }

     function encryptionStr(string input,string key,string seed) public constant returns (string cyphertext){
        bytes32 _cyphertext = stringToBytes32(input) ^ (keccak256(key,seed));
        string memory result = bytes32ToString(_cyphertext);
        return (result);
        //string memory a = bytes32ToString(keccak256(key,seed));

    }

    /*function stringAdd(string one, string two) public constant returns(string) {
        string result = one^two;
        return result;
    }*/

    function getSeed(string arg1 , string arg2, string arg3, string arg4, string arg5) public constant returns(string,string) {
      string memory message = strConcat(arg1,arg2,arg3,arg4,arg5);
      string memory seed = bytes32ToString(keccak256(message));
      return (seed,message);
    }

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

    function testED(string input) public constant returns(string output) {
        string memory encrypTedstr = encryptionStr(input,"a5b9d60f32436310afebcfda832817a68921beb782fabf7915cc0460b443116a","eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c");
        string memory result = decryptionStr(encrypTedstr,"a5b9d60f32436310afebcfda832817a68921beb782fabf7915cc0460b443116a","eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c");
        return result;
    }
    function test(string input) public constant returns (bytes32 res1, string res2) {
        bytes32 result1 = stringToBytes32(input);
        string memory result2 = bytes32ToString(result1);
        return (result1,result2);

    }
    function decryptionStr(string cyphertext,string key,string seed) public constant returns (string palinValue){
        bytes32 value = stringToBytes32(cyphertext) ^ (keccak256(key,seed));
        string memory result = bytes32ToString(value);
        return (result);
    }
      function decryptionInt(uint cyphertext,string key,string seed) public constant returns (uint palinValue){
       uint value = cyphertext ^ uint(keccak256(key,seed));
       return value;
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
}