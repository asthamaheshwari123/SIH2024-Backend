const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("./db/connection");
const user = require("./models/user");
const dotenv = require("dotenv").config();
const connectedDB = require("./db/connection");
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs=require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Specify the folder to store PDFs
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);  // Use a unique name
    }
});

const upload = multer({ storage });

connectedDB();

const corsOptions = {
    origin: process.env.CORSORIGIN, // Replace with your client domain
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  };

  console.log(process.env.CORSORIGIN)


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.send("server is running");
})


app.post("/order", async (req, res) => {
    try {

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        if(!req.body){
            return res.status(400).send("Bad Request");

        }
        const options = req.body;

        const order = await razorpay.orders.create(options);

        if(!order){
            return res.status(400).send("Bad Request");
        }
    // Create a new User instance with the extracted data
        res.json(order);
        
        
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})
app.post("/saveuser", async (req, res) => {
    const { name, ageGroup, gender, preferredDate } = await req.body
    console.log(name, ageGroup, gender, preferredDate);
    
    // if (!name || !ageGroup || !gender || preferredDate) {
    //     return;
    // }
    let newUser = new user({
        name,
        ageGroup,
        gender,
        preferredDate
    });
    // console.log(newUser);
    
    // let user = ndew User(req.body);
    let result;
    try {
         result = await newUser.save();
    } catch (error) {
        console.log("Error saving user", error);
        
    }
   
    console.log(result);
            
          res.send(result);
          // res.json(order);
          
})

app.post("/validate", async (req, res) => {

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    // order_id + " | " + razorpay_payment_id

    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

    const digest = sha.digest("hex");

    if (digest!== razorpay_signature) {
        return res.status(400).json({msg: " Transaction is not legit!"});
    }

    res.json({msg: " Transaction is legit!", orderId: razorpay_order_id,paymentId: razorpay_payment_id});
})

app.post('/api/sendpdf', upload.single('file'), (req, res) => {
    if (req.file) {
        console.log('Received PDF:', req.file);
        res.status(200).json({ message: 'File uploaded successfully' });
    } else {
        res.status(400).json({ message: 'No file uploaded' });
    }

    const mailOptions = {
        from: 'triveni3032@gmail.com', // Replace with your email
        to: req.body.email, // Replace with the recipient's email
        subject: 'Museum Ticket - E-Ticket PDF',
        text: `Dear ${req.body.name},\n\nPlease find your e-ticket attached.\n\nThank you for your purchase.`,
        attachments: [
            {
                filename: req.file.originalname, // File name from the upload
                path: path.join(__dirname, 'uploads', req.file.filename), // Path to the uploaded file
            },
        ],
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent:', info.response);
            const filePath = path.join(__dirname, 'uploads', req.file.filename);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting the file:', err);
              } else {
                console.log('File deleted successfully');
              }
            });
            res.status(200).json({ message: 'File uploaded and email sent successfully' });
        }
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
