# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository appears to be a fresh web project. The specific architecture and structure will be documented here as the codebase develops.

## Development Commands

Commands will be added here as the project structure is established. Common commands may include:

- Build: `npm run build` or equivalent
- Development server: `npm run dev` or equivalent  
- Testing: `npm test` or equivalent
- Linting: `npm run lint` or equivalent

## Architecture

The project architecture will be documented here as code is added to the repository.

## Notes

- This is a fresh repository - update this file as the project structure develops
- Add specific build tools, frameworks, and architectural patterns once established

## To Claude From Me, Lucas ... the USER, dummy! This is some stuff that should help:
### project structure
/ (Next.js “app” directory)
/app
  /page.tsx            ← entry point, renders <MainScene>
  /globals.css         ← Tailwind + base styles
/src
  /components
    Monitor3D.tsx      ← R3F scene, camera, lights, post-process
    ScreenMesh.tsx     ← curved plane + CRT shader + canvas texture
    TerminalCanvas.tsx ← offscreen Canvas/Konva drawing of text log
    TerminalController.tsx
                       ← handles state (entries[]) & user input
    FallbackPage.tsx   ← simple static HTML gallery
  /lib
    theme.ts           ← colors, fonts, spacing
    shaders
      crt.wgsl         ← scanline + vignette shader
      bloom.wgsl       ← (optional custom bloom)
  /utils
    useWebGPU.ts       ← `navigator.gpu` detector + fallback logic
    useCanvasTexture.ts← wraps HTMLCanvas→THREE.Texture updates

### high-level flow
[User Types]
     ↓
TerminalController
  • onKeyDown “Enter” → append entry to entries[]
     ↓
<TerminalCanvas>
  • draws entries[] + blinking cursor on an offscreen <canvas>
  • canvas → THREE.Texture (needsUpdate)
     ↓
<ScreenMesh>
  • applies texture in a ShaderMaterial (WGSL CRT shader)
     ↓
<Monitor3D>
  • contains <ScreenMesh> + parametric bezel (RoundedBox)
  • sets up camera, lights, and bloom pass
     ↓
R3F <Canvas> (WebGPU) renders the scene
     ↓
User sees 3D monitor with live terminal text

### component breakdown
Component           Responsibility
TerminalController  • entries: {type, content}[]• handles keystrokes, command parsing (MVP: echo only)
TerminalCanvas      • Renders entries + cursor to 2D canvas (React-Konva or raw 2D API)• exposes a canvas ref
useCanvasTexture    • Creates a THREE.Texture from offscreen canvas• Sets needsUpdate whenever canvas changes
ScreenMesh          • Subdivided plane geometry with vertex‐shader curvature• ShaderMaterial (WGSL CRT + texture)
Monitor3D           • Wraps <ScreenMesh> in a drei RoundedBox bezel• Adds LED mesh, lights, camera• Sets up post-processing (bloom)
useWebGPU           • Checks navigator.gpu• Returns supported:boolean & auth hook to trigger fallback
FallbackPage        • Static HTML/CSS showing your portfolio items

### data & render pipeline
┌─────────────┐      ┌─────────────────┐      ┌───────────────┐      ┌─────────────┐
│ User Input  │──▶   │ TerminalCtrl    │──▶   │ TerminalCanvas│──▶   │ Canvas Tex  │
└─────────────┘      │ (entries[])     │      │ (2D draw)     │      │ (Three.Texture, needsUpdate)
                     └─────────────────┘      └───────────────┘      └───────┬─────┘
                                                                       ▼
                                                                    ┌──────────────┐
                                                                    │ ScreenMesh   │
                                                                    │ (WGSL CRT    │
                                                                    │  shader +    │
                                                                    │  curvature)  │
                                                                    └───────┬──────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────┐
                                                                  │ Monitor3D Scene │
                                                                  │ (bezel, LED,    │
                                                                  │  lights, bloom) │
                                                                  └───────┬─────────┘
                                                                          │
                                                                          ▼
                                                                     R3F WebGPU
                                                                     `<Canvas>`  

### file-component map
/components
├ ScreenMesh.tsx ── uses shaders/crt.wgsl + useCanvasTexture
├ Monitor3D.tsx ── wraps ScreenMesh + drei RoundedBox + postproc
├ TerminalCanvas.tsx ── draws text log on offscreen canvas
├ TerminalController.tsx ── manages entries[], key handling
└ FallbackPage.tsx ── static portfolio HTML/CSS

### the gist ... in prose
You’re building a truly one-of-a-kind portfolio site that looks and feels like an old-school terminal trapped inside a curved CRT monitor, yet underneath it all it’s powered by the latest WebGPU technology.
At its heart sits a React/Next.js application: your terminal UI is drawn onto an offscreen HTML canvas (using React-Konva or raw 2D APIs), then fed into Three.js via React-Three-Fiber as a texture on a gently bowed plane.
A concise WGSL shader layer adds authentic scanlines, subtle vignetting, and curvature effects, while a bloom post-processing pass lets the screen (and a tiny power LED) glow convincingly against a dark scene.
The code is entirely parametric—no static art assets. Your monitor’s housing is simply a rounded box whose dimensions follow the window’s aspect ratio, complete with an inset bezel and optional accents (screws, vents, knobs)
all generated at runtime. Behind the scenes, a simple React “controller” manages an array of terminal entries (text lines, future widgets), listens for key events, and re-renders the canvas texture on each new line.
If WebGPU isn’t available, the app gracefully falls back to a static Next.js gallery so every visitor still sees your work.
We’ll start by getting a minimum viable pipeline up: project boilerplate, WebGPU detection, terminal state + offscreen canvas, canvas→texture bridge, a curved screen mesh with CRT shader, parametric bezel,
and bloom. Once that slice is working, you can layer on a robust command parser, modular entry types (images, cards, even embedded 3D models), lightweight LLM chat integration,
deeper shader polish (glass reflections, ghosting), and richer content fetched from a CMS. Deployed on Vercel, this site will be a living testament to both retro flair and modern GPU-driven creativity—an
interactive portfolio that truly stands out.