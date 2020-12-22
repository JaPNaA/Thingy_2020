var YT: any;

interface VideoStateData {
    timestamp: number;
    videoId: string;
    playing: boolean;
    ended: boolean;
    position: number;
    playbackRate: number;
}

interface VideoStateDataUpdate extends Partial<VideoStateData> {
    timestamp: number;
}
