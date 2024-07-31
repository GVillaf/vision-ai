import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const PORT = 8000;
const app = express();
// 
app.use(cors({
  origin: 'https://vision-ai-client-xi.vercel.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }).single("file");

let filePath;

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ error: "Error uploading file" });
    }
    filePath = req.file.path;
    // console.log("File uploaded successfully:", filePath);
    res.status(200).json({ filePath: filePath });
  });
});

app.post("/openai", async (req, res) => {
  try {
    const prompt = req.body.message;
    // console.log("Prompt received:", prompt);
    const imageAsBase64 = fs.readFileSync(filePath, "base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageAsBase64}`,
              },
            },
          ],
        },
      ],
    });
    // console.log("OpenAI response:", response.choices[0]);
    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error("Error processing OpenAI request:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
