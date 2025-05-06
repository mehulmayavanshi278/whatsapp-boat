import axios from "axios";
import User, { Otp } from "../models/User.model";
import { sendEmail } from "./sendMail";
import {
  generateSessionForUpload,
  uploadChunk,
  getAssetsId,
} from "./WhatsAppCloudHandler";
import { generateUPILink } from "./paymentHandler";

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

export const sendRoomMateDetailsTemplate = async (type: string, to: string) => {
  const url = "https://graph.facebook.com/v22.0/514190278454480/messages";

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "template",
    template: {
      name: "cii_sharing_partners_template",
      language: {
        code: "en",
      },
      components: [
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


  if (type === "double") {
    sendDoubleSharingHotels(to)
  } else if (type === "triple") {
    sendTripleSharingHotels(to);
  }


};



const sendSingleSharingHotels = async (to: string) => {
  try {


    await axios({
      method: "post",
      url: `https://graph.facebook.com/v22.0/514190278454480/messages`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Please choose a room type to see more details and pricing:",
          },
          footer: {
            text: "Tap a room to select",
          },
          action: {
            button: "View Rooms",
            sections: [
              {
                title: "Room Categories",
                rows: [
                  {
                    id: "Oceanview_Resort",
                    title: "Oceanview Resort",
                    description: "₹1200/night • 1 bed • Private bath",
                  },
                  {
                    id: "Royal_Orchid_Suites",
                    title: "Royal Orchid Suites",
                    description: "₹1800/night • 1 beds • Private bath",
                  },
                  {
                    id: "Sunrise_Comfort_Hotel",
                    title: "Sunrise Comfort Hotel",
                    description: "₹1400/night • 1 beds • Private bath",
                  },
                  {
                    id: "The_Urban_Nest",
                    title: "The Urban Nest",
                    description: "₹1900/night • 1 beds • Private bath",
                  },
                  {
                    id: "Blissful_Nights_Inn",
                    title: "Blissful Nights Inn",
                    description: "₹2200/night • 1 beds • Private bath",
                  },
                ],
              },
            ],
          },
        },
      },
    });



  } catch (err: any) {
    console.log(
      "error handling intereactive message ,",
      err.response?.data || err.message
    );
  }
}


const sendDoubleSharingHotels = async (to: string) => {
  try {


    await axios({
      method: "post",
      url: `https://graph.facebook.com/v22.0/514190278454480/messages`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Please choose a *double sharing* room to see more details and pricing:",
          },
          footer: {
            text: "Tap a room to select",
          },
          action: {
            button: "View Rooms",
            sections: [
              {
                title: "Double Sharing Rooms",
                rows: [
                  {
                    id: "Oceanview_Resort",
                    title: "Oceanview Resort",
                    description: "₹1500/night • 2 beds • Shared bath",
                  },
                  {
                    id: "Royal_Orchid_Suites",
                    title: "Royal Orchid Suites",
                    description: "₹2000/night • 2 beds • Private bath",
                  },
                  {
                    id: "Sunrise_Comfort_Hotel",
                    title: "Sunrise Comfort Hotel",
                    description: "₹1700/night • 2 beds • Shared bath",
                  },
                  {
                    id: "The_Urban_Nest",
                    title: "The Urban Nest",
                    description: "₹2100/night • 2 beds • Private bath",
                  },
                  {
                    id: "Blissful_Nights_Inn",
                    title: "Blissful Nights Inn",
                    description: "₹2300/night • 2 beds • Shared bath",
                  },
                ],
              },
            ],
          },
        },
      },
    });


  } catch (err: any) {
    console.log(
      "error handling intereactive message ,",
      err.response?.data || err.message
    );
  }
}


const sendTripleSharingHotels = async (to: string) => {
  try {
    await axios({
      method: "post",
      url: `https://graph.facebook.com/v22.0/514190278454480/messages`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Please choose a *triple sharing* room to see more details and pricing:",
          },
          footer: {
            text: "Tap a room to select",
          },
          action: {
            button: "View Rooms",
            sections: [
              {
                title: "Triple Sharing Rooms",
                rows: [
                  {
                    id: "Palm_Tree_Retreat",
                    title: "Palm Tree Retreat",
                    description: "₹2500/night • 3 beds • Shared bath",
                  },
                  {
                    id: "Coral_Coast_Hotel",
                    title: "Coral Coast Hotel",
                    description: "₹2700/night • 3 beds • Private bath",
                  },
                  {
                    id: "Moonlight_Residency",
                    title: "Moonlight Residency",
                    description: "₹2600/night • 3 beds • Shared bath",
                  },
                  {
                    id: "Maple_Leaf_Inn",
                    title: "Maple Leaf Inn",
                    description: "₹2800/night • 3 beds • Private bath",
                  },
                  {
                    id: "Hotel_Crystal_Bay",
                    title: "Hotel Crystal Bay",
                    description: "₹3000/night • 3 beds • Sea-facing • Shared bath",
                  },
                ],
              },
            ],
          },
        },
      }
    })
  } catch (err: any) {
    console.log(
      "error handling interactive message,",
      err.response?.data || err.message
    );
  }
};


const handlePayments = async (listreplyDaya: any, to: string) => {
  const amount = listreplyDaya?.description?.split("₹")[1]?.split("/")[0]?.trim();
  const totalAmount = parseInt(amount) * 100;
  const totalAmountInPaise = totalAmount; // Define totalAmountInPaise

  const upiResponse = await generateUPILink(to, totalAmount);
  // Generate a unique reference ID
  const referenceId = upiResponse.ref_id || "default_ref_id";

  console.log(upiResponse, "upiREsponse");
  // Variables for payment details

  // Create UPI payment link (static for now - replace with actual implementation)
  const upiLink = upiResponse.upiLink;
  const paymentId = referenceId; // Use the generated reference ID

  const userData = await User.findOne({
    number: to,
  });

  const userName = userData?.name || "User"; // Fallback to "User" if name is not found

  // No tax
  const taxAmount = 0;


  // Create expiration timestamp (48 hours from now)
  const expirationTime = Math.floor(Date.now() / 1000) + 48 * 60 * 60;

  // Create UPI payment message
  const paymentMessage = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "order_details",
      header: {
        type: "image",
        image: {
          link: "https://whatsease.s3.ap-south-1.amazonaws.com/public/TWS.jpg", // Course logo
        },
      },
      body: {
        text: `Thank you for selecting the Hotel, ${userName}!Please complete the payment to confirm your trip.`,
      },
      footer: {
        text: "Powered by WhatsEase",
      },
      action: {
        name: "review_and_pay",
        parameters: {
          reference_id: paymentId,
          type: "digital-goods",
          payment_settings: [
            {
              type: "upi_intent_link",
              upi_intent_link: {
                link: upiLink,
              },
            },
          ],
          currency: "INR",
          total_amount: {
            value: totalAmountInPaise,
            offset: 100,
          },
          order: {
            status: "pending",
            expiration: {
              timestamp: expirationTime.toString(),
              description:
                "Your payment link will expire if payment is not completed within 48 hours.",
            },
            // items: [courseItem],
            subtotal: {
              value: totalAmountInPaise,
              offset: 100,
            },
            tax: {
              value: taxAmount,
              offset: 100,
              description: "No tax applied",
            },
          },
        },
      },
    },
  };

  try {
    const response = await axios({
      method: "post",
      url: "https://graph.facebook.com/v22.0/514190278454480/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.accessToken}`,
      },
      data: paymentMessage,
    });
    console.log("Payment message sent:", response.data);
  } catch (error:any) {
    console.error(
      "Error sending payment message:",
      error.response?.data || error.message
    );
  }

  try {
    console.log("handle payments");
  } catch (err) {
    console.log(err);
  }
}

export const handleIntereactiveMessage = async (data: any, to: string) => {
  try {
    console.log("intereacive data", data);

    if (data.type === "nfm_reply") {
      const nfmData = JSON.parse(data?.nfm_reply?.response_json);

      if (nfmData?.roommate1_name) {
        console.log("nfm data sharing partners", nfmData);

        const result = [];

        const user = await User.findOne({ number: to });
        if (!user) return;


        for (let i = 1; i <= 2; i++) {
          const name = nfmData[`roommate${i}_name`] || "";
          const phone = nfmData[`roommate${i}_phone`] || "";

          user?.roommates.push({ name, phone });

        }

        await user.save();


      } else if (nfmData?.name) {
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
      }
    } else if (data.type === "list_reply") {
      console.log("list reply data");
      const listReplyData = data?.list_reply;
      console.log("list reply data", listReplyData);

      if (listReplyData?.id === "single") {
        console.log("single");
        sendSingleSharingHotels(to);
      } else if (listReplyData.id === "double") {
        console.log("double");
        sendRoomMateDetailsTemplate("double", to);
      } else if (listReplyData.id === "triple") {
        console.log("triple");
        sendRoomMateDetailsTemplate("triple", to);
      } else if (listReplyData?.description) {
        handlePayments(listReplyData, to)
      }
    }
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
    // await handleShowItems(to);
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
      Authorization: `Bearer ${process.env.accessToken}`,
    },
    data: {
      messaging_product: "whatsapp",
      to: to,
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
                {
                  id: "single",
                  title: "Single Room",
                  description: "1 bed, private bath",
                },
                {
                  id: "double",
                  title: "Double Room",
                  description: "2 beds, shared bath",
                },
                {
                  id: "triple",
                  title: "Triple Room",
                  description: "3 beds, ideal for groups",
                },
              ],
            },
          ],
        },
      },
    },
  });
};




// const handleShowItems=async(to:string)=>{
//   try{

//       const uploadSessionId = await generateSessionForUpload('single.jpg' , '207000' , 'image/jpg');
//       // console.log("upload session id:",uploadSessionId.split(":")[1]);

//       const uploadedChunkFile1 = await uploadChunk(uploadSessionId.split(":")[1] , '/images/single.jpg');
//       const uploadedChunkFile2 = await uploadChunk(uploadSessionId.split(":")[1] , '/images/double.jpg');
//       const uploadedChunkFile3 = await uploadChunk(uploadSessionId.split(":")[1] , '/images/tripple.jpg');

//       const response = await axios({
//           method: 'post',
//           url: 'https://graph.facebook.com/v22.0/502770042892473/message_templates',
//           headers: {
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${process.env.accessToken}`
//           },
//           data: {
//               name: 'carousel_template_media_cards_v1',
//               language: 'en_US',
//               category: "marketing",
//               components: [
//                 {
//                   type:'header',
//                   format:'image',
//                   example:{
//                     header_url:'https://whatsease.s3.ap-south-1.amazonaws.com/public/tripple.jpg'
//                   }
//                 },
//                   {
//                       type: 'body',
//                       text: 'Tender pieces of chicken cooked in a rich, creamy tomato gravy, lightly spiced and finished with a touch of butter — a true comfort food that melts in your mouth.',
//                   },
//                   {
//                       type: 'carousel',
//                       cards: [
//                           {
//                               components: [
//                                   {
//                                       type: 'header',
//                                       format: 'image',
//                                       example: {
//                                           header_handle: [
//                                             uploadedChunkFile1?.h
//                                           ],
//                                           // header_url:"https://whatsease.s3.ap-south-1.amazonaws.com/public/tripple.jpg"
//                                       }
//                                   },
//                                   {
//                                       type: "body",
//                                       text: "Add a touch of elegance to your collection with the beautiful Aloe Blue Elf succulent. Its deep blue-green leaves have a hint of pink around the edges."
//                                   },
//                                   {
//                                       type: 'buttons',
//                                       buttons: [
//                                           {
//                                               type: "quick_reply",
//                                               text: "Send me more like this!"
//                                           },
//                                           {
//                                               type: "url",
//                                               text: "Shop",
//                                               url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                                               example: [
//                                                   "BLUE_ELF"
//                                               ]
//                                           }
//                                       ]
//                                   }
//                               ]
//                           },
//                           {
//                               components: [
//                                   {
//                                       type: 'header',
//                                       format: 'image',
//                                       example: {
//                                           header_handle: [
//                                             uploadedChunkFile2.h
//                                           ],
//                                           // header_url:"https://whatsease.s3.ap-south-1.amazonaws.com/public/tripple.jpg"
//                                       }
//                                   },
//                                   {
//                                       type: "body",
//                                       text: "The Crassula Buddha's Temple is sure to be a conversation starter with its tiny temple shaped leaves, intricate details, and lacy texture."
//                                   },
//                                   {
//                                       type: 'buttons',
//                                       buttons: [
//                                           {
//                                               type: "quick_reply",
//                                               text: "Send me more like this!"
//                                           },
//                                           {
//                                               type: "url",
//                                               text: "Shop",
//                                               url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                                               example: [
//                                                   "BUDDHA"
//                                               ]
//                                           }
//                                       ]
//                                   }
//                               ]
//                           },
//                           {
//                               components: [
//                                   {
//                                       type: 'header',
//                                       format: 'image',
//                                       example: {
//                                           header_handle: [
//                                             uploadedChunkFile3?.h
//                                           ],
//                                           // header_url:"https://whatsease.s3.ap-south-1.amazonaws.com/public/tripple.jpg"
//                                       }
//                                   },
//                                   {
//                                       type: "body",
//                                       text: "The Echeveria 'Black Prince' is a stunning succulent, with near-black leaves, adorned with a hint of green around the edges, giving it its striking appearance."
//                                   },
//                                   {
//                                       type: 'buttons',
//                                       buttons: [
//                                           {
//                                               type: "quick_reply",
//                                               text: "Send me more like this!"
//                                           },
//                                           {
//                                               type: "url",
//                                               text: "Shop",
//                                               url: "https://www.luckyshrub.com/rare-succulents/{{1}}",
//                                               example: [
//                                                   "BLACK_PRINCE"
//                                               ]
//                                           }
//                                       ]
//                                   }
//                               ]
//                           }
//                       ]
//                   }
//               ]
//           }
//       });

//       console.log('template response' , response);

//       const assetid1 = await getAssetsId('/images/single.jpg');
//       const assetid2 = await getAssetsId('/images/double.jpg');
//       const assetid3 = await getAssetsId('/images/tripple.jpg');

//       const res = await axios({
//         method: 'post',
//         url: 'https://graph.facebook.com/v22.0/514190278454480/messages',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${process.env.accessToken}` // Replace with your actual access token
//         },
//         data: {
//           messaging_product: 'whatsapp',
//           recipient_type: 'individual',
//           to: to, // Replace with the actual recipient's phone number
//           type: 'template',
//           template: {
//             name: 'carousel_template_media_cards_v1',
//             language: {
//               code: 'en_US',
//             },
//             components: [
//               {
//                 type:"image",
//                 image:{
//                   link:"https://whatsease.s3.ap-south-1.amazonaws.com/public/tripple.jpg"
//                 }
//               },
//               {
//                 type: 'body',
//                 parameters: [
//                   // { type: 'text', text: 'Pablo' },
//                   // { type: 'text', text: '20%' },
//                   // { type: 'text', text: '20OFF' },
//                 ],
//               },
//               {
//                 type: 'carousel',
//                 cards: [
//                   {
//                     card_index: 0,
//                     components: [
//                       {
//                         type: 'header',
//                         parameters: [
//                           {
//                             type: 'image',
//                             image: { id: assetid1 },
//                           },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'quick_reply',
//                         index: '0',
//                         parameters: [
//                           { type: 'payload', payload: 'more-aloes' },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'url',
//                         index: '1',
//                         parameters: [
//                           { type: 'text', text: 'blue-elf' },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     card_index: 1,
//                     components: [
//                       {
//                         type: 'header',
//                         parameters: [
//                           {
//                             type: 'image',
//                             image: { id: assetid2 },
//                           },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'quick_reply',
//                         index: '0',
//                         parameters: [
//                           { type: 'payload', payload: 'more-crassulas' },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'url',
//                         index: '1',
//                         parameters: [
//                           { type: 'text', text: 'buddhas-temple' },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     card_index: 2,
//                     components: [
//                       {
//                         type: 'header',
//                         parameters: [
//                           {
//                             type: 'image',
//                             image: { id: assetid3 },
//                           },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'quick_reply',
//                         index: '0',
//                         parameters: [
//                           { type: 'payload', payload: 'more-echeverias' },
//                         ],
//                       },
//                       {
//                         type: 'button',
//                         sub_type: 'url',
//                         index: '1',
//                         parameters: [
//                           { type: 'text', text: 'black-prince' },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       });

//       // console.log(res.data);

//   }catch(error:any){
//       if (error.response) {
//           // API responded with an error
//           console.error('Error Status:', error.response.status);
//           console.error('Error Data:', JSON.stringify(error.response.data, null, 2)); // Pretty print
//           console.error('Error Headers:', error.response.headers);
//         } else if (error.request) {
//           // Request was made but no response
//           console.error('No Response Received:', error.request);
//         } else {
//           // Something else happened
//           console.error('Error Message:', error.message);
//         }
//   }
// }

// export const sendRoomCarousel = async (to: string) => {
//   await axios({
//     method: "post",
//     url: `https://graph.facebook.com/v22.0/514190278454480/messages`,
//     headers: {
//       "Content-Type": "application/json",
//        'Authorization':`Bearer ${process.env.accessToken}`,
//     },
//     data: {
//       messaging_product: "whatsapp",
//       to:to,
//       type: "interactive",
//       interactive: {
//         type: "list",
//         header: { type: "text", text: "👋 Welcome to Our Hotel" },
//         body: { text: "Please choose a room type:" },
//         footer: { text: "Tap an item to select" },
//         action: {
//           button: "View Rooms",
//           sections: [
//             {
//               title: "Room Categories",
//               rows: [
//                 { id: "single", title: "Single Room", description: "1 bed, private bath" },
//                 { id: "double", title: "Double Room", description: "2 beds, shared bath" },
//                 { id: "family", title: "Triple Room", description: "3 beds, ideal for groups" }
//               ]
//             }
//           ]
//         }
//       }
//     },
//   });
// };

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
