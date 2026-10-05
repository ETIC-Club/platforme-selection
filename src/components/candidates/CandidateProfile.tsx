'use client'

import { useState } from 'react'
import type { CandidateDetail } from '@/lib/candidate-detail'
import styles from './CandidateProfile.module.css'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ArrowLeftIcon } from '@/components/Icons'
import dashboardStyles from '@/components/dashboard.module.css'
import Link from 'next/link'
import { MapPin, Mail, Phone, FileText } from 'lucide-react'

interface Props {
  candidate: CandidateDetail
  eventId: number
}

type TabType = 'information' | 'compétences' | 'liens' | 'projets' | 'décisions' | 'historique'

const TABS: TabType[] = ['information', 'compétences', 'liens', 'projets', 'décisions', 'historique']

// Simple deterministic color generator based on name
function getAvatarColor(name: string) {
  const colors = ['#0d9488', '#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#c026d3'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

export function CandidateProfile({ candidate, eventId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('information')

  const extra = candidate.extraData || {}
  
  // Format Date safely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  // Parse projects (could be array or string)
  const renderProjects = () => {
    const projetsRaw = extra['Projets'] || extra['projets']
    if (!projetsRaw) return <p className={styles.infoLabel}>Aucun projet renseigné.</p>
    
    let projets: string[] = []
    if (Array.isArray(projetsRaw)) {
      projets = projetsRaw.map(String)
    } else if (typeof projetsRaw === 'string') {
      projets = projetsRaw.split(',').map(s => s.trim())
    }

    return (
      <ul className={styles.projectsList}>
        {projets.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    )
  }
  
  // Parse Compétences
  const renderCompetences = () => {
    const compRaw = extra['Compétences'] || extra['compétences'] || extra['Skills']
    if (!compRaw) return <p className={styles.infoLabel}>Aucune compétence renseignée.</p>
    
    let comp: string[] = []
    if (Array.isArray(compRaw)) {
      comp = compRaw.map(String)
    } else if (typeof compRaw === 'string') {
      comp = compRaw.split(',').map(s => s.trim())
    }

    return (
      <ul className={styles.projectsList}>
        {comp.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    )
  }

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
      {() => (
        <div className={dashboardStyles.mainCard} style={{ backgroundColor: '#F9FAFB', padding: '0', boxShadow: 'none' }}>
          <div className={dashboardStyles.mainHeader} style={{ padding: '0 0 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href={`/events/${eventId}/candidatures`}
                className={dashboardStyles.backLink}
                style={{ fontSize: '14px' }}
              >
                <ArrowLeftIcon />
                <span>Retour aux candidatures</span>
              </Link>
            </div>
          </div>
          
          <div className={styles.container}>
            {/* Top Profile Card */}
      <div className={styles.profileCard}>
        <div 
          className={styles.avatar} 
          style={{ backgroundColor: getAvatarColor(candidate.fullName) }}
        >
          {getInitials(candidate.fullName)}
        </div>
        
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{candidate.fullName}</h1>
          <div className={styles.profileMeta}>
            {candidate.email && (
              <div className={styles.metaItem}>
                <Mail size={16} />
                <span>{candidate.email}</span>
              </div>
            )}
            {candidate.telephone && (
              <div className={styles.metaItem}>
                <Phone size={16} />
                <span>{candidate.telephone}</span>
              </div>
            )}
            {Boolean(extra['Location'] || extra['location'] || extra['Ville']) && (
              <div className={styles.metaItem}>
                <MapPin size={16} />
                <span>{String(extra['Location'] || extra['location'] || extra['Ville'])}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Card with Tabs */}
      <div className={styles.mainCard}>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'information' && (
            <div>
              <div className={styles.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Informations personelles
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Nom</span>
                  <span className={styles.infoValue}>{candidate.nom || '-'}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Prénom</span>
                  <span className={styles.infoValue}>{candidate.prenom || '-'}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Date de naissance</span>
                  <span className={styles.infoValue}>{String(extra['Date de naissance'] || '-')}</span>
                </div>
              </div>

              <div className={styles.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                Informations académiques
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Niveau d'etude</span>
                  <span className={styles.infoValue}>{String(extra["Niveau d'etude"] || extra["Niveau d'étude"] || '-')}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Spécialité</span>
                  <span className={styles.infoValue}>{String(extra['Spécialité'] || extra['specialite'] || '-')}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Etablissement</span>
                  <span className={styles.infoValue}>{String(extra['Etablissement'] || extra['Ecole'] || '-')}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compétences' && (
            <div>
               {renderCompetences()}
            </div>
          )}

          {activeTab === 'liens' && (
            <div className={styles.linksGrid}>
              {extra['Github'] || extra['github'] ? (
                <a href={String(extra['Github'] || extra['github'])} target="_blank" rel="noreferrer" className={styles.linkButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Voir le Github
                </a>
              ) : null}

              {extra['LinkedIn'] || extra['linkedin'] ? (
                <div className={styles.linkItem}>
                  <span className={styles.infoLabel}>linkedin.com/in/</span>
                  <a href={String(extra['LinkedIn'] || extra['linkedin'])} target="_blank" rel="noreferrer" className={styles.infoValue}>
                    {String(extra['LinkedIn'] || extra['linkedin']).split('/').pop()}
                  </a>
                </div>
              ) : null}

              {extra['Portfolio'] || extra['portfolio'] ? (
                <div className={styles.linkItem}>
                  <span className={styles.infoLabel}>portfolio</span>
                  <a href={String(extra['Portfolio'] || extra['portfolio'])} target="_blank" rel="noreferrer" className={styles.infoValue}>
                    {String(extra['Portfolio'] || extra['portfolio']).replace(/^https?:\/\//, '')}
                  </a>
                </div>
              ) : null}

              {extra['CV'] || extra['cv'] ? (
                <a href={String(extra['CV'] || extra['cv'])} target="_blank" rel="noreferrer" className={styles.linkButton}>
                  <FileText size={18} /> Voir le CV
                </a>
              ) : null}
              
              {!extra['Github'] && !extra['LinkedIn'] && !extra['Portfolio'] && !extra['CV'] && (
                 <p className={styles.infoLabel}>Aucun lien renseigné.</p>
              )}
            </div>
          )}

          {activeTab === 'projets' && (
            <div>
              {renderProjects()}
            </div>
          )}

          {activeTab === 'décisions' && (
            <div>
               {candidate.evaluations.length === 0 ? (
                 <p className={styles.infoLabel}>Aucune décision pour le moment.</p>
               ) : (
                 <div className={styles.decisionsList}>
                   {candidate.evaluations.map((ev, i) => (
                     <div key={i} className={styles.decisionItem}>
                       <div className={styles.decisionLeft}>
                         <div className={styles.decisionHeader}>
                           <span className={styles.decisionSelector}>{ev.selectorName}</span>
                           <span className={`${styles.selectorType} ${ev.selectorType === 'RH' ? styles.selectorTypeRH : ''}`}>
                             {ev.selectorType}
                           </span>
                         </div>
                         <div className={styles.decisionComment}>
                           {ev.comment ? `"${ev.comment}"` : "Aucun commentaire"}
                         </div>
                       </div>
                       <div>
                         <span className={`${styles.decisionBadge} ${ev.decision === 'accepter' ? styles.badgeAccepte : ev.decision === 'rejeter' ? styles.badgeRefuse : styles.badgePending}`}>
                           {ev.decision === 'accepter' ? 'Accepté' : ev.decision === 'rejeter' ? 'Refusé' : 'En attente'}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'historique' && (
            <div className={styles.historyList}>
              <div className={styles.historyItem}>
                <div className={`${styles.historyIcon} ${styles.historyIconImport}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
                <div className={styles.historyContent}>
                  <div className={styles.historyTitle}>
                    Importée le {formatDate(candidate.createdAt)}
                  </div>
                </div>
              </div>

              {candidate.finalStatus && (
                <div className={styles.historyItem}>
                  <div className={`${styles.historyIcon} ${styles.historyIconStatus}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className={styles.historyContent}>
                    <div className={styles.historyTitle}>
                      Statut final "{candidate.finalStatus === 'accepte' ? 'Accepted' : candidate.finalStatus === 'refuse' ? 'Refused' : 'Pending'}" atteint
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
        </div>
      )}
    </DashboardLayout>
  )
}
