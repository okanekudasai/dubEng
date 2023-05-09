import { YouTubePlayer } from "react-youtube";
import React from "react";

export interface Script{
    videoId: string;
    id: number;
    startTime: number;
    duration: number;
    content: string;
    translateContent: string;
    pitchList: number[];
    scriptIndex: number;
    scriptLength: number;
    youtubePlayer: YouTubePlayer;
    speechToText: string;
    setSpeechToText: React.Dispatch<React.SetStateAction<string>>;
    timerId: number;
    setTimerId: React.Dispatch<React.SetStateAction<number>>;
}