"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PlaylistViewer from "../components/PlaylistViewer";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg);
  padding-top: 60px; /* Add padding to avoid overlap with back button */
`;

const Header = styled.div`
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: var(--primary);
`;

const DropdownContainer = styled.div`
  position: relative;
  min-width: 300px;
`;

const DropdownButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
  }

  svg {
    color: var(--text-secondary);
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const PlaylistItem = styled.div<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--hover);
  }

  ${props => props.isActive && `
    background-color: var(--primary);
    color: white;
    
    &:hover {
      background-color: var(--primary);
    }
  `}
`;

const PlaylistName = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
`;

const PlaylistDescription = styled.p`
  font-size: 0.85rem;
  margin: 0;
  opacity: 0.8;
  line-height: 1.4;
`;

const ViewerContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
`;

interface Playlist {
  id: string;
  title: string;
  description: string;
  targetTheoryLevel: string;
  targetTechLevel: string;
  estimatedDuration: number;
  difficultyRating: number;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tutorials/playlists");
      if (response.ok) {
        const data = await response.json();
        // Ensure we have an array
        const playlistsArray = Array.isArray(data) ? data : (data.playlists || []);
        setPlaylists(playlistsArray);
        // Auto-select first playlist if available
        if (playlistsArray.length > 0) {
          setSelectedPlaylistId(playlistsArray[0].id);
          setSelectedPlaylist(playlistsArray[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylistId(playlist.id);
    setSelectedPlaylist(playlist);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <Container>
        <Header>
          <PageTitle>All Playlists</PageTitle>
          <LoadingSpinner>Loading playlists...</LoadingSpinner>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <PageTitle>All Playlists</PageTitle>
        <DropdownContainer data-dropdown>
          <DropdownButton isOpen={isDropdownOpen} onClick={toggleDropdown}>
            <span>{selectedPlaylist?.title || "Select a playlist"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </DropdownButton>
          <DropdownMenu isOpen={isDropdownOpen}>
            {Array.isArray(playlists) && playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                isActive={selectedPlaylistId === playlist.id}
                onClick={() => handlePlaylistSelect(playlist)}
              >
                <PlaylistName>{playlist.title}</PlaylistName>
                <PlaylistDescription>{playlist.description}</PlaylistDescription>
              </PlaylistItem>
            ))}
          </DropdownMenu>
        </DropdownContainer>
      </Header>

      <ViewerContainer>
        {selectedPlaylistId && (
          <PlaylistViewer playlistId={selectedPlaylistId} />
        )}
      </ViewerContainer>
    </Container>
  );
}
