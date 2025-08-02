import { useCallback, useContext, useEffect, useState, useRef } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { ElevenLabsParam, DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import { buildUrl } from "@/utils/buildUrl";
import { websocketService } from '../services/websocketService';
import { MessageMiddleOut } from "@/features/messages/messageMiddleOut";
import { ResponseTimeIndicator } from "@/components/responseTimeIndicator";
import { ResponseTimeTracker, ResponseTimeData } from "@/utils/responseTimeTracker";

const m_plus_2 = M_PLUS_2({
  variable: "--font-m-plus-2",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});

type LLMCallbackResult = {
  processed: boolean;
  error?: string;
};

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsParam, setElevenLabsParam] = useState<ElevenLabsParam>(DEFAULT_ELEVEN_LABS_PARAM);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [restreamTokens, setRestreamTokens] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  // needed because AI speaking could involve multiple audios being played in sequence
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openRouterKey') || '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';
    }
    return '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';
  });
  const [responseTimeTracker] = useState(() => new ResponseTimeTracker());
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData>({
    isProcessing: false
  });
  
  // Use ref to get current chatLog value without causing re-renders
  const chatLogRef = useRef<Message[]>([]);
  chatLogRef.current = chatLog;
  
  // Track current request to prevent overlapping requests
  const currentRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt);
      setElevenLabsParam(params.elevenLabsParam);
      setChatLog(params.chatLog);
    }
    if (window.localStorage.getItem("elevenLabsKey")) {
      const key = window.localStorage.getItem("elevenLabsKey") as string;
      setElevenLabsKey(key);
    } else {
      // Set the provided ElevenLabs API key
      setElevenLabsKey("sk_6b852b7169387aa0eda03078183f428c49f3e03bdd946963");
      localStorage.setItem("elevenLabsKey", "sk_6b852b7169387aa0eda03078183f428c49f3e03bdd946963");
    }
    // load openrouter key from localStorage
    const savedOpenRouterKey = localStorage.getItem('openRouterKey');
    if (savedOpenRouterKey) {
      setOpenRouterKey(savedOpenRouterKey);
    } else {
      // Set the provided OpenRouter API key
      setOpenRouterKey('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');
      localStorage.setItem('openRouterKey', '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');
    }
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);

  useEffect(() => {
    process.nextTick(() => {
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, elevenLabsParam, chatLog })
      )

      // store separately to be backward compatible with local storage data
      window.localStorage.setItem("elevenLabsKey", elevenLabsKey);
    }
    );
  }, [systemPrompt, elevenLabsParam, chatLog]);

  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = `url(${backgroundImage})`;
      // document.body.style.backgroundSize = 'cover';
      // document.body.style.backgroundPosition = 'center';
    } else {
      document.body.style.backgroundImage = `url(${buildUrl("/bg-c.png")})`;
    }
  }, [backgroundImage]);

  // Resume audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (viewer?.model?._lipSync?.audio.state === 'suspended') {
        console.log('Resuming audio context on user interaction');
        viewer.model._lipSync.audio.resume().then(() => {
          console.log('Audio context resumed successfully');
        }).catch(error => {
          console.error('Failed to resume audio context:', error);
        });
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [viewer]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  /**
   * 文ごとに音声を直接でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      elevenLabsKey: string,
      elevenLabsParam: ElevenLabsParam,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      console.log('handleSpeakAi called, setting isAISpeaking to true');
      setIsAISpeaking(true);  // Set speaking state before starting
      responseTimeTracker.startTTSRequest();
      try {
        await speakCharacter(
          screenplay, 
          elevenLabsKey, 
          elevenLabsParam, 
          viewer, 
          () => {
            setIsPlayingAudio(true);
            responseTimeTracker.endTTSRequest();
            setResponseTimeData(responseTimeTracker.getCurrentData());
            console.log('audio playback started');
            onStart?.();
          }, 
          () => {
            setIsPlayingAudio(false);
            console.log('audio playback completed');
            onEnd?.();
          }
        );
      } catch (error) {
        console.error('Error during AI speech:', error);
        responseTimeTracker.endTTSRequest();
        setResponseTimeData(responseTimeTracker.getCurrentData());
      } finally {
        console.log('handleSpeakAi finished, setting isAISpeaking to false');
        setIsAISpeaking(false);  // Ensure speaking state is reset even if there's an error
      }
    },
    [viewer, responseTimeTracker]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      console.log('handleSendChat called with:', text);
      console.log('Current chatLog length:', chatLogRef.current.length);
      
      const newMessage = text;
      if (newMessage == null) return;

      // Check if there's already a request in progress
      if (currentRequestRef.current) {
        console.log('Request already in progress, skipping:', text);
        return;
      }

      const requestId = Date.now().toString();
      currentRequestRef.current = requestId;
      console.log('Starting new request with ID:', requestId);

      setChatProcessing(true);
      responseTimeTracker.startLLMRequest();
      setResponseTimeData(responseTimeTracker.getCurrentData());
      // Add user's message to chat log
      const messageLog: Message[] = [
        ...chatLogRef.current,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // Process messages through MessageMiddleOut
      const messageProcessor = new MessageMiddleOut();
      const processedMessages = messageProcessor.process([
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ]);

      let localOpenRouterKey = openRouterKey;
      if (!localOpenRouterKey) {
        // fallback to free key for users to try things out
        localOpenRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;
      }

      console.log('Using OpenRouter key:', localOpenRouterKey ? 'Set' : 'Not set');
      console.log('Using ElevenLabs key:', elevenLabsKey ? 'Set' : 'Not set');

      const stream = await getChatResponseStream(processedMessages, openAiKey, localOpenRouterKey).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );
      if (stream == null) {
        setChatProcessing(false);
        responseTimeTracker.endLLMRequest();
        setResponseTimeData(responseTimeTracker.getCurrentData());
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();
      let hasProcessedAnyContent = false;
      
      // Add a timeout to ensure message is displayed even if streaming fails
      const streamTimeout = setTimeout(() => {
        if (!hasProcessedAnyContent && receivedMessage.trim()) {
          console.log('Stream timeout - displaying message:', receivedMessage);
          const fullMessage = `${tag} ${receivedMessage.trim()}`;
          aiTextLog = fullMessage;
          setAssistantMessage(fullMessage);
          hasProcessedAnyContent = true;
        }
      }, 5000); // 5 second timeout
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedMessage += value;
          
          // Debug logging to track streaming
          console.log('Stream chunk received:', value);
          console.log('Total received message:', receivedMessage);

          // console.log('receivedMessage');
          // console.log(receivedMessage);

          // 返答内容のタグ部分の検出
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);

            console.log('tag:');
            console.log(tag);
          }

          // 返答を一単位で切り出して処理する
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n.!?]|.{10,}[、,])/
          );
          
          console.log('Sentence match result:', sentenceMatch);
          console.log('Current receivedMessage:', receivedMessage);
          
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);

            console.log('sentence:');
            console.log(sentence);

            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // 発話不要/不可能な文字列だった場合はスキップ
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              console.log('Skipping empty sentence');
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;
            hasProcessedAnyContent = true;

            console.log('Processing sentence for TTS:', sentence);
            console.log('Generated aiTalks:', aiTalks);
            console.log('ElevenLabs key available:', !!elevenLabsKey);

            // 文ごとに音声を生成 & 再生、返答を表示
            const currentAssistantMessage = sentences.join(" ");
            setAssistantMessage(currentAssistantMessage); // Always update the message immediately
            
            if (aiTalks[0]) {
              console.log('Calling handleSpeakAi with:', aiTalks[0]);
              handleSpeakAi(aiTalks[0], elevenLabsKey, elevenLabsParam, () => {
                console.log('TTS playback started');
                // Audio playback started callback
              });
            } else {
              console.log('No aiTalks generated, skipping TTS');
            }
          } else {
            // If no sentence match but we have content, still update the message
            // This handles cases where the response doesn't end with punctuation
            if (receivedMessage.trim() && !hasProcessedAnyContent) {
              console.log('No sentence match, but processing remaining content:', receivedMessage.trim());
              const fullMessage = `${tag} ${receivedMessage.trim()}`;
              aiTextLog = fullMessage;
              setAssistantMessage(fullMessage);
              hasProcessedAnyContent = true;
              
              // Also try to process this for TTS
              const aiTalks = textsToScreenplay([fullMessage], koeiroParam);
              if (aiTalks[0]) {
                console.log('Calling handleSpeakAi for remaining content with:', aiTalks[0]);
                handleSpeakAi(aiTalks[0], elevenLabsKey, elevenLabsParam, () => {
                  console.log('TTS playback started for remaining content');
                });
              }
            }
          }
        }
        
        // Handle any remaining content that wasn't processed
        if (receivedMessage.trim() && !hasProcessedAnyContent) {
          const fullMessage = `${tag} ${receivedMessage.trim()}`;
          aiTextLog = fullMessage;
          setAssistantMessage(fullMessage);
        }
        
        // Clear the timeout since streaming completed successfully
        clearTimeout(streamTimeout);
      } catch (e) {
        console.error('Error in handleSendChat:', e);
        setChatProcessing(false);
        responseTimeTracker.endLLMRequest();
        responseTimeTracker.setProcessing(false);
        setResponseTimeData(responseTimeTracker.getCurrentData());
        clearTimeout(streamTimeout);
        
        // Clear the current request on error
        if (currentRequestRef.current === requestId) {
          currentRequestRef.current = null;
          console.log('Request cleared due to error:', requestId);
        }
      } finally {
        reader.releaseLock();
        // Ensure chatProcessing is always reset
        setChatProcessing(false);
      }

      // アシスタントの返答をログに追加
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      console.log('Final AI response:', aiTextLog);
      console.log('Adding to chat log:', messageLogAssistant);
      setChatLog(messageLogAssistant);
      
      // Ensure assistant message is always set, even if no TTS was processed
      if (!assistantMessage && aiTextLog) {
        setAssistantMessage(aiTextLog);
      }
      
      // Chat log will be automatically shown by the Menu component when messages are added
      
      setChatProcessing(false);
      responseTimeTracker.endLLMRequest();
      responseTimeTracker.setProcessing(false);
      setResponseTimeData(responseTimeTracker.getCurrentData());
      
      // Clear the current request
      if (currentRequestRef.current === requestId) {
        currentRequestRef.current = null;
        console.log('Request completed and cleared:', requestId);
      }
    },
    [systemPrompt, handleSpeakAi, openAiKey, elevenLabsKey, elevenLabsParam, openRouterKey]
  );

  const handleTokensUpdate = useCallback((tokens: any) => {
    setRestreamTokens(tokens);
  }, []);

  // Set up global websocket handler
  useEffect(() => {
    websocketService.setLLMCallback(async (message: string): Promise<LLMCallbackResult> => {
      try {
        console.log('Websocket callback called with:', message);
        console.log('System state - isAISpeaking:', isAISpeaking, 'isPlayingAudio:', isPlayingAudio, 'chatProcessing:', chatProcessing);
        
        if (isAISpeaking || isPlayingAudio || chatProcessing) {
          console.log('Skipping message processing - system busy');
          return {
            processed: false,
            error: 'System is busy processing previous message'
          };
        }
        
        await handleSendChat(message);
        return {
          processed: true
        };
      } catch (error) {
        console.error('Error processing message:', error);
        return {
          processed: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    });
  }, [handleSendChat, chatProcessing, isPlayingAudio, isAISpeaking]);

  const handleOpenRouterKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = event.target.value;
    setOpenRouterKey(newKey);
    localStorage.setItem('openRouterKey', newKey);
  };

  const handleResumeAudio = () => {
    if (viewer?.model?._lipSync?.audio.state === 'suspended') {
      console.log('Manually resuming audio context');
      viewer.model._lipSync.audio.resume().then(() => {
        console.log('Audio context resumed successfully');
        alert('Audio context resumed!');
      }).catch(error => {
        console.error('Failed to resume audio context:', error);
        alert('Failed to resume audio context: ' + error.message);
      });
    } else {
      console.log('Audio context is already running');
      alert('Audio context is already running');
    }
  };

  return (
    <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
      <Meta />
      <ResponseTimeIndicator
        llmResponseTime={responseTimeData.llmResponseTime}
        ttsResponseTime={responseTimeData.ttsResponseTime}
        isProcessing={responseTimeData.isProcessing}
      />
      {/* Debug button for audio context */}
      <button 
        onClick={handleResumeAudio}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Resume Audio
      </button>
      {/*<Introduction
        openAiKey={openAiKey}
        onChangeAiKey={setOpenAiKey}
        elevenLabsKey={elevenLabsKey}
        onChangeElevenLabsKey={setElevenLabsKey}
      />*/}
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        openAiKey={openAiKey}
        elevenLabsKey={elevenLabsKey}
        openRouterKey={openRouterKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        elevenLabsParam={elevenLabsParam}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        onChangeAiKey={setOpenAiKey}
        onChangeElevenLabsKey={setElevenLabsKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeElevenLabsParam={setElevenLabsParam}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        backgroundImage={backgroundImage}
        onChangeBackgroundImage={setBackgroundImage}
        onTokensUpdate={handleTokensUpdate}
        onChatMessage={handleSendChat}
        onChangeOpenRouterKey={handleOpenRouterKeyChange}
      />
      <GitHubLink />
    </div>
  );
}