import { Participant } from "../models/participant.model.js";

export const handleSignupParticipant = async (req, res) => {
  try {
    const { email, participantType  } = req.body;

    const existingUser = await Participant.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // email verification
    if (participantType === "IIIT") {
      const validDomains = [
        "@students.iiit.ac.in",
        "@research.iiit.ac.in"
      ];

      const isValid = validDomains.some(domain =>
        email.endsWith(domain)
      );

      if (!isValid) {
        return res.status(400).json({
          message: "Invalid IIIT email domain"
        });
      }
    }


    if (participantType === "NON_IIIT") {
      const iiitDomains = [
        "@students.iiit.ac.in",
        "@research.iiit.ac.in"
      ];

      const isIIITDomain = iiitDomains.some(domain =>
        email.endsWith(domain)
      );

      if (isIIITDomain) {
        return res.status(400).json({
          message: "IIIT domain must select IIIT participant type"
        });
      }
    }
    // creating the participant
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
    const token = generateToken(participant._id, "PARTICIPANT");

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });
    
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
