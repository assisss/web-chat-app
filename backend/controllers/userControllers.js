const asyncHandler = require("express-async-handler");
const User = require("../models/userModel.js");
const generateToken = require("../config/genrateToken.js");
 

const registerUser = asyncHandler(async(req,res)=>{
    const{name,email,password,pic}=req.body;

    if(!name || !email || !password){
        throw new Error("Please enter the all fields");
    }

    const userExists = await User.findOne({email});

    if(userExists){
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({name,email,password,pic});
    //console.log(user);

    if(user){
        res.status(201).json({
            _id : user._id,
            name : user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token : generateToken(user._id)
        })
    }else{
        res.status(400);
        throw new Error("user not found");
    }
    
});

const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if( !email || !password){
        throw new Error("Please enter the all fields");
    }
  
    const user = await User.findOne({ email });
  
    if (user && (await user.matchPassword(password))) {
        
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        pic: user.pic,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
});

const allUsers = asyncHandler(async (req, res) => {
    let keyword = {};
    
    if (req.query.search) {
        const searchStr = req.query.search.replace('@gmail.com', ''); // Remove "@gmail.com" from the search string
        keyword = {  
            
                 name: { $regex: searchStr, $options: "i" } 
                
                //  { email: { $regex: searchStr, $options: "i" } }
           
        };
    }
    
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
});



module.exports ={registerUser, authUser,allUsers};