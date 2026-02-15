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






