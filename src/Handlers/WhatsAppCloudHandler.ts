import axios  from 'axios';
import fs from 'fs'; // to get file size dynamically if you need it
import path from 'path';

// Function to upload a file using dynamic parameters
export const generateSessionForUpload = async (fileName:string, fileLength:string, fileType:string) => {
  try {
    const response = await axios.post(`https://graph.facebook.com/v22.0/${process.env.APP_ID}/uploads`, null, {
      params: {
        file_name: fileName,
        file_length: fileLength,
        file_type: fileType,
        access_token: process.env.accessToken,
      }
    });

    // console.log('Upload Successful:', response.data);
    return response.data?.id;
  } catch (error:any) {
    console.error('Upload Failed:', error.response ? error.response.data : error.message);
  }
};

// Example usage


export const uploadChunk = async (uploadSessionId:string, filePath:string) => {
  const absolutePath = path.join(__dirname, '..', filePath);

  const fileStat = fs.statSync(absolutePath); // 🛑 important
  const fileSize = fileStat.size;             // get size in bytes

  const fileStream = fs.createReadStream(absolutePath);

  const response = await axios.post(
      `https://graph.facebook.com/v22.0/upload:${uploadSessionId}`,
      fileStream,
      {
          headers: {
              Authorization: `OAuth ${process.env.USER_TOKEN}`,
              'file_offset': '0',
              'Content-Type': 'application/octet-stream',
              'Content-Length': fileSize.toString(), // ✅ must send
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
      }
  );
  console.log("upload response" , response.data);
  return response.data;
};






export const getAssetsId = async (filePath:string) => {
  try {
    // Upload the media file to the WhatsApp Business API
    const absolutePath = path.join(__dirname, '..', filePath)
    const response = await axios({
      method: 'post',
      url: 'https://graph.facebook.com/v22.0/641841379005586/media',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${process.env.accessToken}`,
      },
      data: {
        messaging_product: 'whatsapp',
        file: fs.createReadStream(absolutePath),
      },
    });

    // Return the media asset ID
    // console.log("assets id data:", response)
    return response.data.id;
  } catch (error:any) {
    console.error('Error uploading media:', error.response ? error.response.data : error.message);
    throw new Error('Failed to upload media');
  }
};





