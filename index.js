const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const Multer = require("multer");
const fs = require('fs');
const { default: axios } = require('axios');
const { PrismaClient } = require("@prisma/client");
const FormData = require('form-data');

const prisma = new PrismaClient();

const multer = Multer({
  storage: Multer.memoryStorage(),
});

const port = process.env.PORT || 5001;

const app = express();
app.use(cors("*"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/test", async (req, res) => {
  res.status(200).send({
    status: true,
    message: "Hello, World!!",
  })
});

app.post('/upload', multer.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .send({ status: "error", message: "Please provide an image" });
    }

    const filePath = Date.now() + '-' + req.file.originalname;

    fs.writeFileSync(filePath, req.file.buffer);

    const formData = new FormData();

    formData.append('image', fs.createReadStream(filePath));

    const response = await axios.post(process.env.API_ML, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    const result = response.data;

    await prisma.historyScan.create({
      data: {
        name: result.name,
      }
    });

    fs.unlinkSync(filePath);

    res.status(201).send({
      status: true,
      message: "Berhasil di scan",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: "Internal Server Error"
    })
  }
})

app.listen(port, () => {
  console.log(`Server running on port: http://localhost:${port}/`);
});
