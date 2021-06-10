pragma solidity >=0.4.22 <0.9.0;

contract Decentragram {
  string public name = "Decentragram";
  uint public imageCount = 0; 

  struct Image{
    uint id; 
    string hash; 
    string description; 
    uint tipAmount; 
    address payable author; 
  }

  //Store images
  mapping(uint => Image) public images; 

  event ImageEvent(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  ); 

  //Create images
  function uploadImage(string memory _imgHash, string memory _description) public {
    require(bytes(_imgHash).length > 0 && bytes(_description).length > 0 && msg.sender != address(0x0)); 

    images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender); 
    emit ImageEvent(imageCount, _imgHash, _description, 0, msg.sender);
    imageCount++; 

  }

  //Tip images
  function tipImageOwner(uint _id) public payable { 
    require(_id >= 0 && _id < imageCount);
    Image memory image = images[_id]; 
    address payable author = image.author; 

    author.transfer(msg.value); 
    image.tipAmount = image.tipAmount + msg.value; 
    images[_id] = image; 

    emit ImageEvent(_id, image.hash, image.description, image.tipAmount, author);

  }


}