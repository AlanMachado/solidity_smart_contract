pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

    struct Star {
        string name;
        string ra;
        string dec;
        string mag;
        string story;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    mapping(bytes32 => uint256) public coordinatorIsUnique;

    function checkIfStarExist(string _dec, string _mag, string _cent) public returns (bool){
        string memory coordinatorConcat = strConcat(_dec,_mag,_cent);
        bytes32 encoded = keccak256(abi.encodePacked(coordinatorConcat));
        return coordinatorIsUnique[encoded] == 1;
    }

    function createStar(string _name, string _ra, string _dec, string _mag, string _story, uint256 _tokenId) public{
        require(bytes(_dec).length > 0 && bytes(_mag).length > 0 && bytes(_ra).length > 0);
        require(!checkIfStarExist(_ra,_dec,_mag));

        string memory coordinatorConcat = strConcat(_ra,_dec,_mag);
        bytes32 encoded = keccak256(abi.encodePacked(coordinatorConcat));
        Star memory newStar = Star(_name, _ra,_dec, _mag,_story);

        tokenIdToStarInfo[_tokenId] = newStar;
        coordinatorIsUnique[encoded] = 1;

        mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0);
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost);

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function encodeString(string a) public returns (bytes32) {
        return keccak256(abi.encodePacked(a));
    }

    function strConcat(string _a, string _b, string _c) internal returns (string){
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        string memory abc = new string(_ba.length + _bb.length + _bc.length);
        bytes memory babc = bytes(abc);
        uint k = 0;
        for (uint i = 0; i < _ba.length; i++) babc[k++] = _ba[i];
        for (i = 0; i < _bb.length; i++) babc[k++] = _bb[i];
        for (i = 0; i < _bc.length; i++) babc[k++] = _bc[i];
        return string(babc);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}