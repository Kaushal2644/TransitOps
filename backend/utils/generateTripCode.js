import Trip from "../models/Trip.js";

// Generates sequential trip codes like TR001, TR002...
const generateTripCode = async () => {
  const count = await Trip.countDocuments();
  const nextNumber = (count + 1).toString().padStart(3, "0");
  return `TR${nextNumber}`;
};

export default generateTripCode;