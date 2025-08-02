import { ElevenLabsParam } from "../constants/elevenLabsParam";
import { TalkStyle } from "../messages/messages";
import axios from 'axios';
import { ElevenLabsClient } from "elevenlabs";


export async function synthesizeVoice(
  message: string,
  speaker_x: number,
  speaker_y: number,
  style: TalkStyle,
  elevenLabsKey: string,
  elevenLabsParam: ElevenLabsParam
) {

  // Set the API key for ElevenLabs API. 
  // Do not use directly. Use environment variables.
  const API_KEY = elevenLabsKey;
  // Set the ID of the voice to be used.
  const VOICE_ID = elevenLabsParam.voiceId;

  console.log('elevenlabs voice_id: ' + VOICE_ID);
  console.log('elevenlabs api_key: ' + (API_KEY ? 'Set' : 'Not set'));
  console.log('elevenlabs message: ' + message);

  // Set options for the API request.
  const options = {
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    headers: {
      accept: 'audio/mpeg', // Set the expected response type to audio/mpeg.
      'content-type': 'application/json', // Set the content type to application/json.
      'xi-api-key': `${API_KEY}`, // Set the API key in the headers.
    },
    data: {
      text: message, // Pass in the inputText as the text to be converted to speech.
    },
    responseType: 'arraybuffer', // Set the responseType to arraybuffer to receive binary data as response.
  };

  try {
    // Send the API request using Axios and wait for the response.
    // @ts-ignore
    const speechDetails = await axios.request(options);
    // Get the binary audio data received from the API response.
    const data = speechDetails.data;
    
    console.log('ElevenLabs API response received, data size:', data.byteLength);
    
    // Convert the array buffer to base64
    const base64Audio = Buffer.from(data).toString('base64');
    
    // Create a data URL for the audio
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('ElevenLabs audio data URL created successfully');
    return {
      audio: dataUrl
    };
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    throw error;
  }
}

export async function getVoices(elevenLabsKey: string) {
  const client = new ElevenLabsClient({ apiKey: elevenLabsKey });
  const voices = await client.voices.getAll();
  console.log(voices);
  return voices;
  /*
  const response = await axios.get('https://api.elevenlabs.io/v1/voices');
  console.log(response.data);

  return response.data;
  */
}
