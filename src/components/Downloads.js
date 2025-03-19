import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from './dashboard/DashboardLayout';
import { FaDownload, FaWindows, FaApple, FaFilePdf, FaInfoCircle } from 'react-icons/fa';

const DownloadsContainer = styled.div`
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text);
`;

const DownloadCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
    color: var(--primary);
  }
`;

const CardContent = styled.div`
  color: var(--text-secondary);
`;

const DownloadsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const DownloadItem = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(30, 30, 46, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
`;

const DownloadHeader = styled.div`
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(78, 205, 196, 0.2));
  padding: 1.5rem;
  display: flex;
  align-items: center;
`;

const DownloadIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  svg {
    font-size: 1.8rem;
    color: var(--primary);
  }
`;

const DownloadInfo = styled.div`
  flex: 1;
`;

const DownloadName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const DownloadVersion = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const DownloadDetails = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const DownloadDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const DownloadMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const DownloadSize = styled.span``;

const DownloadDate = styled.span``;

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  width: 100%;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
    text-decoration: none;
    color: white;
  }
`;

const ResourcesSection = styled.div`
  margin-top: 2rem;
`;

const ResourcesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResourceItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(30, 30, 46, 0.5);
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const ResourceIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(108, 99, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  svg {
    color: var(--primary);
    font-size: 1.5rem;
  }
`;

const ResourceInfo = styled.div`
  flex: 1;
`;

const ResourceTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const ResourceDescription = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const ResourceLink = styled.a`
  color: var(--primary);
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  
  svg {
    margin-left: 0.5rem;
  }
  
  &:hover {
    text-decoration: underline;
  }
`;

function Downloads() {
  return (
    <DownloadsContainer>
      <SectionTitle>Downloads</SectionTitle>
      
      <DownloadCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle><FaDownload /> Cymasphere Installers</CardTitle>
        <CardContent>
          <DownloadsGrid>
            <DownloadItem>
              <DownloadHeader>
                <DownloadIcon>
                  <FaApple />
                </DownloadIcon>
                <DownloadInfo>
                  <DownloadName>Cymasphere for macOS</DownloadName>
                  <DownloadVersion>Version 1.2.3</DownloadVersion>
                </DownloadInfo>
              </DownloadHeader>
              <DownloadDetails>
                <DownloadDescription>
                  Universal installer for macOS with standalone app and plugins (AU, VST3) for both Apple Silicon and Intel processors.
                </DownloadDescription>
                <DownloadMeta>
                  <DownloadSize>162 MB</DownloadSize>
                  <DownloadDate>Updated: March 10, 2023</DownloadDate>
                </DownloadMeta>
                <DownloadButton href="#">
                  <FaDownload /> Download for macOS
                </DownloadButton>
              </DownloadDetails>
            </DownloadItem>
            
            <DownloadItem>
              <DownloadHeader>
                <DownloadIcon>
                  <FaWindows />
                </DownloadIcon>
                <DownloadInfo>
                  <DownloadName>Cymasphere for Windows</DownloadName>
                  <DownloadVersion>Version 1.2.3</DownloadVersion>
                </DownloadInfo>
              </DownloadHeader>
              <DownloadDetails>
                <DownloadDescription>
                  Complete installer for Windows 10/11 including standalone app and plugin formats (VST3).
                </DownloadDescription>
                <DownloadMeta>
                  <DownloadSize>145 MB</DownloadSize>
                  <DownloadDate>Updated: March 10, 2023</DownloadDate>
                </DownloadMeta>
                <DownloadButton href="#">
                  <FaDownload /> Download for Windows
                </DownloadButton>
              </DownloadDetails>
            </DownloadItem>
          </DownloadsGrid>
        </CardContent>
      </DownloadCard>
      
      <DownloadCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CardTitle><FaInfoCircle /> Resources</CardTitle>
        <CardContent>
          <ResourcesSection>
            <ResourcesList>
              <ResourceItem>
                <ResourceIcon>
                  <FaFilePdf />
                </ResourceIcon>
                <ResourceInfo>
                  <ResourceTitle>Quick Start Guide</ResourceTitle>
                  <ResourceDescription>Get up and running with Cymasphere in minutes</ResourceDescription>
                </ResourceInfo>
                <ResourceLink href="#">
                  Download PDF <FaDownload />
                </ResourceLink>
              </ResourceItem>
            </ResourcesList>
          </ResourcesSection>
        </CardContent>
      </DownloadCard>
    </DownloadsContainer>
  );
}

function DownloadsWithLayout() {
  return (
    <DashboardLayout>
      <Downloads />
    </DashboardLayout>
  );
}

export default DownloadsWithLayout; 