import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, setCustomTheme } from '../store/themeSlice';
import { playSaveSound, playLoadSound, playLoadSound2, playDeleteSound, playNotificationSound } from '../utils/soundUtils';
import { getGeneralSettings, updateSoundSettingsApi } from '../utils/generalSettingsUtil';
import HeaderFooterCreator from './HeaderFooterCreator';
import OrganizationSettings from './OrganizationSettings';
import ReferralCommissionModal from './ReferralCommissionModal';
import {
  IoColorPaletteOutline,
  IoVolumeHighOutline,
  IoDocumentTextOutline,
  IoBusinessOutline,
  IoVolumeMute,
  IoVolumeHigh,
  IoPlay,
  IoArrowBack,
  IoCheckmarkCircle,
  IoSparklesOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLeafOutline,
  IoBrushOutline,
  IoLayersOutline
} from "react-icons/io5";
import "./Settings.css";
import "./GeneralSettings.css";

const themeConfigs = [
  {
    key: "theme-teal",
    name: "Clinical Teal",
    badge: "Recommended",
    subtitle: "Calming emerald & teal tones optimized for high-contrast clinical OPD workflow.",
    icon: IoLeafOutline,
    preview: {
      sidebar: "#0c4e4c",
      accent: "#1a9e9b",
      surface: "#ffffff",
      bg: "#f3fbfb",
      text: "#0c4e4c",
    },
    tags: ["High Contrast", "Clinical", "Day Shift"]
  },
  {
    key: "theme-light",
    name: "Medical Blue",
    badge: "Corporate",
    subtitle: "Classic navy & cobalt accents designed for structured hospital records.",
    icon: IoSunnyOutline,
    preview: {
      sidebar: "#173a5e",
      accent: "#2f78c8",
      surface: "#ffffff",
      bg: "#e7f1fb",
      text: "#173a5e",
    },
    tags: ["Balanced", "Corporate", "Classic"]
  },
  {
    key: "theme-dark",
    name: "Dark Mode",
    badge: "Night Shift",
    subtitle: "Deep obsidian canvas with cyber-cyan glowing auras to reduce eye fatigue.",
    icon: IoMoonOutline,
    preview: {
      sidebar: "#0d131f",
      accent: "#00d2ff",
      surface: "#151d2c",
      bg: "#0b0f17",
      text: "#f8fafc",
    },
    tags: ["Eye Comfort", "OLED Dark", "Cyan Glow"]
  },
  {
    key: "theme-custom",
    name: "Custom Studio",
    badge: "Studio",
    subtitle: "Craft your tailored palette, custom corner radius, and typography scale.",
    icon: IoBrushOutline,
    preview: {
      sidebar: "#1e293b",
      accent: "#6366f1",
      surface: "#ffffff",
      bg: "#f8fafc",
      text: "#0f172a",
    },
    tags: ["Personalized", "Variables", "Flexible"]
  },
];

const GeneralSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selected = useSelector(state => state.theme.theme);
  const custom = useSelector(state => state.theme.custom);
  const [activeSection, setActiveSection] = useState('organization');
  
  // Sound settings state
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('soundVolume');
    return stored ? parseFloat(stored) : 50;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem('soundMuted');
    return stored ? JSON.parse(stored) : false;
  });

  // Load sound settings from DB
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const gs = await getGeneralSettings();
        if (active && gs?.soundSettings) {
          if (gs.soundSettings.volume !== undefined) {
            setVolume(Number(gs.soundSettings.volume));
          }
          if (gs.soundSettings.isMuted !== undefined) {
            setIsMuted(Boolean(gs.soundSettings.isMuted));
          }
        }
      } catch (_) {}
    })();
    return () => {
      active = false;
    };
  }, []);

  // Save volume to localStorage and soundUtils + persist to DB (debounced)
  useEffect(() => {
    localStorage.setItem('soundVolume', volume);
    window.globalSoundVolume = volume / 100;
    const timer = setTimeout(() => {
      updateSoundSettingsApi(volume, isMuted);
    }, 600);
    return () => clearTimeout(timer);
  }, [volume, isMuted]);

  // Save mute state to localStorage
  useEffect(() => {
    localStorage.setItem('soundMuted', isMuted);
    window.globalSoundMuted = isMuted;
  }, [isMuted]);

  // Handlers for custom theme settings
  const handleCustom = (key, value) => {
    dispatch(setCustomTheme({ [key]: value }));
  };

  // Test sound functions
  const testSaveSound = () => {
    if (!isMuted) playSaveSound();
  };

  const testLoadSound = () => {
    if (!isMuted) playLoadSound();
  };

  const testLoginSound = () => {
    if (!isMuted) playLoadSound2();
  };

  const testDeleteSound = () => {
    if (!isMuted) playDeleteSound();
  };

  const testNotificationSound = () => {
    if (!isMuted) playNotificationSound();
  };

  // Live preview for custom theme
  useEffect(() => {
    if (selected === 'theme-custom') {
      const root = document.documentElement;
      root.style.setProperty('--btn-radius', (custom.btnRadius || 8) + 'px');
      root.style.setProperty('--btn-opacity', custom.btnOpacity || 1);
      root.style.setProperty('--text-size', (custom.textSize || 16) + 'px');
      root.style.setProperty('--bg-main', custom.bgMain || '#e7f1fb');
      root.style.setProperty('--accent', custom.accent || '#2f78c8');
    } else {
      const root = document.documentElement;
      root.style.removeProperty('--btn-radius');
      root.style.removeProperty('--btn-opacity');
      root.style.removeProperty('--text-size');
      root.style.removeProperty('--bg-main');
      root.style.removeProperty('--accent');
    }
  }, [selected, custom]);

  const activeThemeMeta = themeConfigs.find(t => t.key === selected) || themeConfigs[0];

  return (
    <section className="page general-settings-page-wrapper">
      <div className="settings-page general-settings-container">
        {/* Page Top Header Bar */}
        <div className="general-settings-top-header">
          <div className="general-header-left">
            <button
              onClick={() => navigate(-1)}
              className="general-back-btn"
              title="Go back to previous page"
            >
              <IoArrowBack className="back-icon" />
              <span>Back</span>
            </button>
            <div className="general-title-block">
              <div className="general-title-row">
                <h2>General Settings</h2>
                <span className={`general-theme-pill ${selected}`}>
                  <activeThemeMeta.icon className="theme-pill-icon" />
                  {activeThemeMeta.name}
                </span>
              </div>
              <p className="general-subtitle">
                Configure clinic profile, live appearance themes, audio feedback, and document branding.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="general-settings-nav-bar">
          <button
            className={`general-nav-item ${activeSection === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveSection('organization')}
          >
            <IoBusinessOutline className="nav-icon" />
            <span>Organization & Branding</span>
          </button>
          <button
            className={`general-nav-item ${activeSection === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveSection('themes')}
          >
            <IoColorPaletteOutline className="nav-icon" />
            <span>Themes & Appearance</span>
          </button>
          <button
            className={`general-nav-item ${activeSection === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveSection('sounds')}
          >
            <IoVolumeHighOutline className="nav-icon" />
            <span>Sound Effects</span>
          </button>
          <button
            className={`general-nav-item ${activeSection === 'header-footer' ? 'active' : ''}`}
            onClick={() => setActiveSection('header-footer')}
          >
            <IoDocumentTextOutline className="nav-icon" />
            <span>Header & Footer Designer</span>
          </button>
          <button
            className={`general-nav-item ${activeSection === 'commission' ? 'active' : ''}`}
            onClick={() => setActiveSection('commission')}
          >
            <IoLayersOutline className="nav-icon" />
            <span>Referral Commissions</span>
          </button>
        </div>

        {/* Section 1: Organization Profile & Branding */}
        {activeSection === 'organization' && (
          <div className="general-section-content">
            <OrganizationSettings />
          </div>
        )}

        {/* Section 2: Themes & Appearance */}
        {activeSection === 'themes' && (
          <div className="general-section-content themes-section-content">
            <div className="section-intro-card">
              <div className="intro-icon-box">
                <IoColorPaletteOutline />
              </div>
              <div className="intro-text">
                <h3>Interface Themes</h3>
                <p>
                  Choose a visual theme tailored to your clinic workspace. All screens, cards, charts, and prescription drawers adapt instantaneously.
                </p>
              </div>
            </div>

            {/* Theme Selector Cards Grid */}
            <div className="theme-cards-grid">
              {themeConfigs.map(item => {
                const isCurrent = selected === item.key;
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`theme-card ${item.key} ${isCurrent ? 'selected' : ''}`}
                    onClick={() => dispatch(setTheme(item.key))}
                  >
                    <div className="theme-card-top">
                      <div className="theme-card-icon-title">
                        <div className="theme-type-icon">
                          <IconComponent />
                        </div>
                        <div>
                          <h4 className="theme-name">{item.name}</h4>
                          <span className="theme-badge">{item.badge}</span>
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="theme-active-indicator">
                          <IoCheckmarkCircle className="check-icon" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    <p className="theme-desc">{item.subtitle}</p>

                    {/* Mini Visual UI Mockup */}
                    <div className="theme-preview-mockup">
                      <div
                        className="mockup-sidebar"
                        style={{ background: item.preview.sidebar }}
                      >
                        <div className="mockup-dot" />
                        <div className="mockup-dot" />
                        <div className="mockup-dot" />
                      </div>
                      <div
                        className="mockup-body"
                        style={{ background: item.preview.bg }}
                      >
                        <div
                          className="mockup-header-bar"
                          style={{
                            background: item.preview.surface,
                            borderBottom: `1px solid ${item.preview.accent}33`
                          }}
                        >
                          <div
                            className="mockup-bar-title"
                            style={{ background: item.preview.text }}
                          />
                        </div>
                        <div className="mockup-cards-row">
                          <div
                            className="mockup-card"
                            style={{
                              background: item.preview.surface,
                              borderColor: `${item.preview.accent}44`
                            }}
                          >
                            <div
                              className="mockup-chip"
                              style={{ background: item.preview.accent }}
                            />
                            <div
                              className="mockup-line"
                              style={{ background: `${item.preview.text}55` }}
                            />
                          </div>
                          <div
                            className="mockup-card"
                            style={{
                              background: item.preview.surface,
                              borderColor: `${item.preview.accent}44`
                            }}
                          >
                            <div
                              className="mockup-chip"
                              style={{ background: item.preview.accent }}
                            />
                            <div
                              className="mockup-line"
                              style={{ background: `${item.preview.text}55` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Color Swatches Palette */}
                    <div className="theme-swatches-row">
                      <span className="swatches-label">Palette:</span>
                      <div className="swatches-dots">
                        <span
                          className="swatch-dot"
                          title="Sidebar"
                          style={{ background: item.preview.sidebar }}
                        />
                        <span
                          className="swatch-dot"
                          title="Accent"
                          style={{ background: item.preview.accent }}
                        />
                        <span
                          className="swatch-dot"
                          title="Surface"
                          style={{
                            background: item.preview.surface,
                            border: '1px solid #ccc'
                          }}
                        />
                        <span
                          className="swatch-dot"
                          title="Background"
                          style={{
                            background: item.preview.bg,
                            border: '1px solid #ccc'
                          }}
                        />
                      </div>
                      <div className="theme-tags">
                        {item.tags.map(tag => (
                          <span key={tag} className="tag-pill">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`theme-apply-btn ${isCurrent ? 'active' : ''}`}
                    >
                      {isCurrent ? "Currently Applied" : "Select Theme"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Theme Studio Controls */}
            {selected === 'theme-custom' && (
              <div className="custom-theme-studio-card">
                <div className="studio-header">
                  <div className="studio-icon">
                    <IoBrushOutline />
                  </div>
                  <div>
                    <h4>Custom Theme Studio</h4>
                    <p>Adjust fine UI properties, button curves, text scaling, and core palette.</p>
                  </div>
                </div>

                <div className="studio-controls-grid">
                  <div className="studio-control-group">
                    <div className="control-label-row">
                      <label>Button Corner Radius</label>
                      <span className="val-chip">{custom.btnRadius || 8}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      value={custom.btnRadius ?? 8}
                      onChange={e => handleCustom('btnRadius', Number(e.target.value))}
                      className="studio-range-slider"
                    />
                  </div>

                  <div className="studio-control-group">
                    <div className="control-label-row">
                      <label>Button Opacity</label>
                      <span className="val-chip">{Math.round((custom.btnOpacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.05}
                      value={custom.btnOpacity ?? 1}
                      onChange={e => handleCustom('btnOpacity', Number(e.target.value))}
                      className="studio-range-slider"
                    />
                  </div>

                  <div className="studio-control-group">
                    <div className="control-label-row">
                      <label>Base Typography Scale</label>
                      <span className="val-chip">{custom.textSize || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={24}
                      value={custom.textSize ?? 16}
                      onChange={e => handleCustom('textSize', Number(e.target.value))}
                      className="studio-range-slider"
                    />
                  </div>

                  <div className="studio-control-group">
                    <div className="control-label-row">
                      <label>App Background Canvas</label>
                      <span className="val-chip">{custom.bgMain || '#e7f1fb'}</span>
                    </div>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={custom.bgMain || '#e7f1fb'}
                        onChange={e => handleCustom('bgMain', e.target.value)}
                        className="studio-color-input"
                      />
                      <input
                        type="text"
                        value={custom.bgMain || '#e7f1fb'}
                        onChange={e => handleCustom('bgMain', e.target.value)}
                        className="studio-hex-text"
                      />
                    </div>
                  </div>

                  <div className="studio-control-group">
                    <div className="control-label-row">
                      <label>Primary Accent Color</label>
                      <span className="val-chip">{custom.accent || '#2f78c8'}</span>
                    </div>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={custom.accent || '#2f78c8'}
                        onChange={e => handleCustom('accent', e.target.value)}
                        className="studio-color-input"
                      />
                      <input
                        type="text"
                        value={custom.accent || '#2f78c8'}
                        onChange={e => handleCustom('accent', e.target.value)}
                        className="studio-hex-text"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview interactive sample */}
                <div className="studio-preview-banner">
                  <span className="banner-title">Live Interactive Preview:</span>
                  <button
                    type="button"
                    className="studio-sample-btn"
                    style={{
                      borderRadius: (custom.btnRadius || 8) + 'px',
                      opacity: custom.btnOpacity ?? 1,
                      background: custom.accent || '#2f78c8',
                      fontSize: (custom.textSize || 16) + 'px'
                    }}
                  >
                    Sample Action Button
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Sound Effects */}
        {activeSection === 'sounds' && (
          <div className="general-section-content sounds-section-content">
            <div className="sounds-console-card">
              <div className="sounds-console-header">
                <div className="sounds-header-left">
                  <div className="sounds-icon-badge">
                    <IoVolumeHighOutline />
                  </div>
                  <div>
                    <h3>Audio & Sound Feedback</h3>
                    <p>Configure acoustic sound effects for user interactions, saves, transitions, and alerts.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`sound-mute-toggle-btn ${isMuted ? 'muted' : 'unmuted'}`}
                  title={isMuted ? "Click to unmute sound effects" : "Click to mute all sounds"}
                >
                  {isMuted ? (
                    <>
                      <IoVolumeMute className="btn-sound-icon" />
                      <span>Sound Muted</span>
                    </>
                  ) : (
                    <>
                      <IoVolumeHigh className="btn-sound-icon" />
                      <span>Sound Enabled</span>
                    </>
                  )}
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="sound-master-volume-box">
                <div className="volume-label-row">
                  <div className="volume-label-title">
                    <span>Master Output Volume</span>
                    <span className="volume-state-chip">
                      {isMuted ? "Muted" : `${volume}%`}
                    </span>
                  </div>
                </div>
                <div className="volume-slider-row">
                  <IoVolumeMute className="vol-icon min" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    disabled={isMuted}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="volume-range-slider"
                  />
                  <IoVolumeHigh className="vol-icon max" />
                </div>
              </div>

              {/* Test Soundboard Grid */}
              <div className="soundboard-section">
                <div className="soundboard-header">
                  <h4>Interactive Soundboard</h4>
                  <p>Click any test card to audition the acoustic feedback audio file.</p>
                </div>

                <div className="soundboard-grid">
                  <button
                    type="button"
                    onClick={testSaveSound}
                    disabled={isMuted}
                    className="sound-tile save-sound"
                  >
                    <div className="tile-icon-box save">
                      <IoPlay />
                    </div>
                    <div className="tile-details">
                      <h5>Save & Confirm</h5>
                      <p>Triggered on saving records, prescriptions, and updates.</p>
                    </div>
                    <span className="tile-action-chip">Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={testLoadSound}
                    disabled={isMuted}
                    className="sound-tile load-sound"
                  >
                    <div className="tile-icon-box load">
                      <IoPlay />
                    </div>
                    <div className="tile-details">
                      <h5>Load / Transition</h5>
                      <p>Acoustic chime played on loading data and drawer sliding.</p>
                    </div>
                    <span className="tile-action-chip">Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={testLoginSound}
                    disabled={isMuted}
                    className="sound-tile login-sound"
                  >
                    <div className="tile-icon-box login">
                      <IoPlay />
                    </div>
                    <div className="tile-details">
                      <h5>Welcome / Login</h5>
                      <p>Harmonic chime played when authenticated successfully.</p>
                    </div>
                    <span className="tile-action-chip">Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={testDeleteSound}
                    disabled={isMuted}
                    className="sound-tile delete-sound"
                  >
                    <div className="tile-icon-box delete">
                      <IoPlay />
                    </div>
                    <div className="tile-details">
                      <h5>Delete / Warning</h5>
                      <p>Haptic warning cue played on deleting records or items.</p>
                    </div>
                    <span className="tile-action-chip">Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={testNotificationSound}
                    disabled={isMuted}
                    className="sound-tile notification-sound"
                  >
                    <div className="tile-icon-box notify" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                      <IoPlay />
                    </div>
                    <div className="tile-details">
                      <h5>Notification / Alert</h5>
                      <p>Acoustic chime for inbound referrals and urgent clinical alerts.</p>
                    </div>
                    <span className="tile-action-chip">Test</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Header & Footer Section */}
        {activeSection === 'header-footer' && (
          <div className="general-section-content header-footer-section-content">
            <HeaderFooterCreator />
          </div>
        )}

        {/* Section 5: Referral Commission Rules */}
        {activeSection === 'commission' && (
          <div className="general-section-content commission-section-content">
            <ReferralCommissionModal isInline={true} />
          </div>
        )}
      </div>
    </section>
  );
};

export default GeneralSettings;
