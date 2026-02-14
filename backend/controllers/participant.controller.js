import { Participant } from "../models/participant.model.js";

export const handleSignupParticipant = async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await Participant.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const participant = await Participant.create(req.body);

    res.status(201).json({
      message: "User created successfully",
      userId: participant._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};  


export const handleLoginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await participant.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
  message: "Login successful",
  user: {
    _id: participant._id,
    fName: participant.fName,
    email: participant.email
  }
});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
