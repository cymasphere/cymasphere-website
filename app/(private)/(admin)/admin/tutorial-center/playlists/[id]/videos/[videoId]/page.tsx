"use client";
import React from "react";
import { useParams } from "next/navigation";
import PlaylistViewer from "../../../../components/PlaylistViewer";

export default function VideoDetail() {
  const params = useParams();
  const playlistId = params.id as string;
  const videoId = params.videoId as string;

  return (
    <PlaylistViewer 
      playlistId={playlistId} 
      initialVideoId={videoId} 
    />
  );
}