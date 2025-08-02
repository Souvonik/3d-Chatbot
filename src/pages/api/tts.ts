import fetch from "node-fetch";
import { synthesizeVoice } from "@/features/elevenlabs/elevenlabs";
import { DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ audio: '' });
  }

  try {
    const { message, speakerX, speakerY, style, elevenLabsKey } = req.body;

    if (!message || !elevenLabsKey) {
      return res.status(400).json({ audio: '' });
    }

    const voice = await synthesizeVoice(
      message, 
      speakerX || 0, 
      speakerY || 0, 
      style || 'talk', 
      elevenLabsKey, 
      DEFAULT_ELEVEN_LABS_PARAM
    );

    res.status(200).json(voice);
  } catch (error) {
    console.error('TTS API Error:', error);
    res.status(500).json({ audio: '' });
  }
}
