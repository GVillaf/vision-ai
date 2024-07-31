import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url"; // Importa para manejar el directorio actual

dotenv.config();

const PORT = 8000;
const app = express();

app.use(cors({
  origin: 'https://vision-ai-client-xi.vercel.app', // Asegúrate de que este sea el dominio correcto de tu cliente
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Obtener el nombre del archivo actual y el directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear la carpeta 'uploads' si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
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
    res.status(200).json({ filePath: filePath });
  });
});

app.post("/openai", async (req, res) => {
  try {
    const prompt = req.body.message;
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
    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error("Error processing OpenAI request:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
