import axios from "axios";
import User, { Otp } from "../models/User.model";
import { sendEmail } from "./sendMail";
import {
  generateSessionForUpload,
  uploadChunk,
  getAssetsId,
} from "./WhatsAppCloudHandler";

export const sendWelcomeTemplate = async (to: string) => {
  try {
    const axios = require("axios");

    const url = "https://graph.facebook.com/v22.0/514190278454480/messages";

    const data = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "template",
      template: {
        name: "cii_welcome_remplate_v1",
        language: {
          code: "en",
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: "https://whatsease.s3.ap-south-1.amazonaws.com/public/cii-logo+(1).jpg",
                },
              },
            ],
            sub_type: "flow",
            index: 0,
          },
          {
            type: "button",
            sub_type: "flow",
            index: "0",
            parameters: [
              {
                type: "action",
                action: {
                  flow_token: "flows-builder-41b29403",
                },
              },
            ],
          },
        ],
      },
    };

    const res = await axios({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: data,
    });
    console.log("Res,", res);
  } catch (err: any) {
    console.log("error sending template", err.response?.data || err.message);
  }
};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendVerificationTemplate = async (email: string, to: string) => {
  const generatedOTP = generateOTP();
  console.log("generated otp:", generatedOTP);
  try {
    const recipient = email;
    const subject = "OTP for CII Registartion";
    const text = `<span>Here is your OTP ${generatedOTP} for CII Registration</span>
    <br><span>OTP is valid for 5 minutes</span>
    <br><span>Please click on the link below to verify your email</span>
    <br><a href="https://api.whatsapp.com/send?phone=919427606998&text=${generatedOTP}">Verify Email</a>`;

    const email_info_id = await sendEmail(recipient, subject, text);
    if (!email_info_id) {
      return;
    }

    console.log("proces", process.env.accessToken);

    try {
      let newOtp;

      newOtp = await Otp.findOne({ phone: to });
      if (!newOtp) {
        newOtp = await new Otp({ otp: generatedOTP, phone: to });
      }

      newOtp.otp = generatedOTP;
      newOtp.otpExpires = new Date(Date.now() + 600 * 1000);
      await newOtp.save();

      const response = await axios({
        method: "post",
        url: "https://graph.facebook.com/v22.0/514190278454480/messages",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.accessToken}`,
        },
        data: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: {
            preview_url: false,
            body: `we have sent an OTP to the registered email ${email}, please send a otp
                `,
          },
        },
      });
      console.log("Message sent:", response.data);
    } catch (error: any) {
      console.error(
        "Error sending message:",
        error.response?.data || error.message
      );
    }
  } catch (err) {
    console.log(err);
  }
};

export const handleIntereactiveMessage = async (data: any, to: string) => {
  try {
    console.log("intereacive data", data);

    const nfmData = JSON.parse(data?.nfm_reply?.response_json);
    console.log("nfmData", nfmData);

    const isUserExist = await User.findOne({ email: nfmData?.email });
    if (isUserExist) {
      //
    }

    await sendVerificationTemplate(nfmData?.email, to);

    const newUserData = {
      name: nfmData?.name,
      email: nfmData?.email,
      number: to,
    };
    const newUserEntry = await new User(newUserData);
    await newUserEntry.save();

    console.log("user created userData:", newUserEntry);
  } catch (err: any) {
    console.log(
      "error handling intereactive message ,",
      err.response?.data || err.message
    );
  }
};

const sendOtpNotVerifiedTemplate = async (to: string) => {
  try {
    const response = await axios({
      method: "post",
      url: "https://graph.facebook.com/v22.0/514190278454480/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: `❌ The OTP you entered is incorrect. Please try again.`,
        },
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const verifyOTP = async (otp: string, to: string) => {
  try {
    const user = await Otp.findOne({ phone: to });
    if (!user) {
    }
    if (otp !== user?.otp) {
      sendOtpNotVerifiedTemplate(to);
      return;
    }
    console.log("otp verified");

    const response = await axios({
      method: "post",
      url: "https://graph.facebook.com/v22.0/514190278454480/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: `OTP Verified Successfully`,
        },
      },
    });

    // await createCarouselTemplate(to);
    await sendRoomCarousel(to);
  } catch (err) {
    console.log(err);
  }
};


export const sendRoomCarousel = async (to: string) => {
  await axios({
    method: "post",
    url: `https://graph.facebook.com/v22.0/514190278454480/messages`,
    headers: {
      "Content-Type": "application/json",
       'Authorization':`Bearer ${process.env.accessToken}`,
    },
    data: {
      messaging_product: "whatsapp",
      to:to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "👋 Welcome to Our Hotel" },
        body: { text: "Please choose a room type:" },
        footer: { text: "Tap an item to select" },
        action: {
          button: "View Rooms",
          sections: [
            {
              title: "Room Categories",
              rows: [
                { id: "single", title: "Single Room", description: "1 bed, private bath" },
                { id: "double", title: "Double Room", description: "2 beds, shared bath" },
                { id: "family", title: "Triple Room", description: "3 beds, ideal for groups" }
              ]
            }
          ]
        }
      }
    },
  });
};

// const createCarouselTemplate = async (to:string) => {
//   try {
//     const uploadSessionId = await generateSessionForUpload(
//       "single.jpg",
//       "207000",
//       "image/jpg"
//     );
//     // console.log("upload session id:",uploadSessionId.split(":")[1]);

//     const uploadedChunkFile1 = await uploadChunk(
//       uploadSessionId.split(":")[1],
//       "/images/single.jpg"
//     );
//     const uploadedChunkFile2 = await uploadChunk(
//       uploadSessionId.split(":")[1],
//       "/images/double.jpg"
//     );
//     const uploadedChunkFile3 = await uploadChunk(
//       uploadSessionId.split(":")[1],
//       "/images/tripple.jpg"
//     );

//     const response = await axios({
//       method: "post",
//       url: "https://graph.facebook.com/v22.0/502770042892473/message_templates",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.accessToken}`,
//       },
//       data: {
//         name: "carousel_template_media_cards_v1",
//         language: "en_US",
//         category: "marketing",
//         components: [
//           {
//             type: "body",
//             text: "Tender pieces of chicken cooked in a rich, creamy tomato gravy, lightly spiced and finished with a touch of butter — a true comfort food that melts in your mouth.",
//           },
//           {
//             type: "carousel",
//             cards: [
//               {
//                 components: [
//                   {
//                     type: "header",
//                     format: "image",
//                     example: {
//                       header_handle: [uploadedChunkFile1?.h],      
//                     },
//                   },
//                   {
//                     type: "body",
//                     text: "For one guest. Offers full privacy with a private bed, bathroom, and all basic amenities.",
//                   },
//                   {
//                     type: "buttons",
//                     buttons: [
//                       {
//                         type: "quick_reply",
//                         text: "See All !",
//                       },
//                       // {
//                       //     type: "url",
//                       //     text: "Shop",
//                       //     url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                       //     example: [
//                       //         "BLUE_ELF"
//                       //     ]
//                       // }
//                     ],
//                   },
//                 ],
//               },
//               {
//                 components: [
//                   {
//                     type: "header",
//                     format: "image",
//                     example: {
//                       header_handle: [uploadedChunkFile2.h],         
//                     },
                
//                   },
//                   {
//                     type: "body",
//                     text: "For two guests. Includes two single beds or one double bed with shared facilities.",
//                   },
//                   {
//                     type: "buttons",
//                     buttons: [
//                       {
//                         type: "quick_reply",
//                         text: "See All !",
//                       },
//                       // {
//                       //     type: "url",
//                       //     text: "Shop",
//                       //     url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                       //     example: [
//                       //         "BUDDHA"
//                       //     ]
//                       // }
//                     ],
//                   },
//                 ],
//               },
//               {
//                 components: [
//                   {
//                     type: "header",
//                     format: "image",
//                     example: {
//                       header_handle: [uploadedChunkFile3?.h],
                     
//                     },
          
//                   },
//                   {
//                     type: "body",
//                     text: "For three guests. Comes with three beds or a mix of beds, ideal for groups or families.",
//                   },
//                   {
//                     type: "buttons",
//                     buttons: [
//                       {
//                         type: "quick_reply",
//                         text: "See All !",
//                       },
//                       // {
//                       //     type: "url",
//                       //     text: "Shop",
//                       //     url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                       //     example: [
//                       //         "BLACK_PRINCE"
//                       //     ]
//                       // }
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//     });

//     console.log("response:", response);




//     const assetid1 = await getAssetsId('/images/atulpurohit.png');
//     const assetid2 = await getAssetsId('/images/dinojames.png');
//     const assetid3 = await getAssetsId('/images/kshitij.png');



//     const res = await axios({
//       method: 'post',
//       url: 'https://graph.facebook.com/v22.0/514190278454480/messages',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.accessToken}` // Replace with your actual access token
//       },
//       data: {
//         messaging_product: 'whatsapp',
//         recipient_type: 'individual',
//         to: to, // Replace with the actual recipient's phone number
//         type: 'template',
//         template: {
//           name: 'carousel_template_media_cards_v1',
//           language: {
//             code: 'en_US',
//           },
//           components: [
//             {
//               type: 'body',
//               parameters: [
//                 // { type: 'text', text: 'Pablo' },
//                 // { type: 'text', text: '20%' },
//                 // { type: 'text', text: '20OFF' },
//               ],
//             },
//             {
//               type: 'carousel',
//               cards: [
//                 {
//                   card_index: 0,
//                   components: [
//                     {
//                       type: 'header',
//                       parameters: [
//                         {
//                           type: 'image',
//                           image: { id: assetid1 },
//                         },
//                       ],
//                     },
//                     {
//                       type: 'button',
//                       sub_type: 'quick_reply',
//                       index: '0',
//                       parameters: [
//                         { type: 'payload', payload: 'more-aloes' },
//                       ],
//                     },
//                     // {
//                     //   type: 'button',
//                     //   sub_type: 'url',
//                     //   index: '1',
//                     //   parameters: [
//                     //     { type: 'text', text: 'blue-elf' },
//                     //   ],
//                     // },
//                   ],
//                 },
//                 {
//                   card_index: 1,
//                   components: [
//                     {
//                       type: 'header',
//                       parameters: [
//                         {
//                           type: 'image',
//                           image: { id: assetid2 },
//                         },
//                       ],
//                     },
//                     {
//                       type: 'button',
//                       sub_type: 'quick_reply',
//                       index: '0',
//                       parameters: [
//                         { type: 'payload', payload: 'more-crassulas' },
//                       ],
//                     },
//                     // {
//                     //   type: 'button',
//                     //   sub_type: 'url',
//                     //   index: '1',
//                     //   parameters: [
//                     //     { type: 'text', text: 'buddhas-temple' },
//                     //   ],
//                     // },
//                   ],
//                 },
//                 {
//                   card_index: 2,
//                   components: [
//                     {
//                       type: 'header',
//                       parameters: [
//                         {
//                           type: 'image',
//                           image: { id: assetid3 },
//                         },
//                       ],
//                     },
//                     {
//                       type: 'button',
//                       sub_type: 'quick_reply',
//                       index: '0',
//                       parameters: [
//                         { type: 'payload', payload: 'more-echeverias' },
//                       ],
//                     },
//                     // {
//                     //   type: 'button',
//                     //   sub_type: 'url',
//                     //   index: '1',
//                     //   parameters: [
//                     //     { type: 'text', text: 'black-prince' },
//                     //   ],
//                     // },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//       },
//     });






//   } catch (error: any) {
//     console.log(
//       "error creating template",
//       error.response?.data || error.message
//     );
//   }
// };
