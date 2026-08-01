import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    //hash pass
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller, error.message:", error.message);
    return res.status(500).json({ message: "Error occurred while signing up" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller, error.message:", error.message);
    return res.status(500).json({ message: "Error occurred while logging in" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller, error.message:", error.message);
    return res
      .status(500)
      .json({ message: "Error occurred while logging out" });
  }
};

export const updateProfile = async (req, res) => {
    try{

        const  {profilePic} = req.body;
        const userId = req.user._id;

        console.log("profilePic:", profilePic.substring(0, 50));
        console.log(cloudinary.config());

        if(!profilePic){
            return res.status(400).json({message: "Please provide a profile picture"});
        }

        const result = await cloudinary.api.ping();
    console.log("Ping:", result);
// const uploadResult = await cloudinary.uploader.upload(profilePic);
//         console.log("Cloudinary upload result:", uploadResult.secure_url);
        try {
  const uploadResult = await cloudinary.uploader.upload(profilePic, {
  folder: "chat-app",
  resource_type: "image",
  overwrite: true,
});

  console.log("UPLOAD:", uploadResult);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePic: uploadResult.secure_url },
    { new: true }
  ).select("-password");

  return res.status(200).json(updatedUser);

} catch (err) {
  console.dir(err, { depth: null });

  console.log("Error keys:", Object.keys(err));

  if (err.response) {
    console.dir(err.response, { depth: null });
  }

  return res.status(500).json({
    message: err.message,
  });
}
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {profilePic: uploadResult.secure_url},
            {new: true}
        ).select("-password");

        res.status(200).json(updatedUser);
    } catch(error){
        console.log("FULL ERROR OBJECT:", JSON.stringify(error, null, 2));
        console.log("Error in updateProfile controller, error.message:", error.message);
        return res.status(500).json({message: "Error occurred while updating profile"});
    }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller, error.message:", error.message);
    return res
      .status(500)
      .json({ message: "Error occurred while checking authentication" });
  }
};
