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
LucasFlora.com will be a unique portfolio website presented as a retro terminal interface on a 3D CRT monitor. The plan is to combine modern web tech with a nostalgic aesthetic. Key technologies include:
	•	Next.js (React) – Provides project structure, routing, and easy deployment. The site will mostly run as a client-side app, but Next enables flexibility (e.g. a fallback static page for no-WebGPU users).
	•	Three.js with WebGPU – Powers the 3D graphics and shader effects. We’ll use Three.js’s latest WebGPU renderer to leverage GPU features and modern shading (WGSL). No need to support old WebGL, since we’ll provide a fallback for non-WebGPU browsers.
	•	React-Three-Fiber (R3F) – Integrates Three.js with React, letting us build the 3D scene as React components. This allows us to manage state and content easily in React while rendering the scene in Three.js ￼. An open-source experiment has shown this approach working well (using Three.js + R3F) ￼.
	•	Canvas/Konva for Screen Content – We can render the terminal text and UI onto an off-screen HTML5 canvas (or use a library like React-Konva) and use that canvas as a texture on the 3D screen ￼. This means the on-screen content can be built with familiar React tools (text, images, etc.) and then displayed in the 3D scene ￼.
	•	Shaders and Post-Processing – Custom shader effects (written in WGSL for WebGPU) will create the CRT screen look (scanlines, curvature, glow). We’ll also use a bloom post-processing pass for glowing highlights. All of this will be done with Three.js’s WebGPU capabilities.

Development Strategy: We will build a minimum viable product (MVP) first that demonstrates the full pipeline end-to-end (basic terminal output on a 3D screen with CRT and bloom effects). Then we’ll iterate with more features. This ensures we “lock in” the core architecture early and have a working prototype before adding complexity. Given this is a personal project, we can keep formal testing light – quick manual testing is fine (no need to over-engineer test suites at this stage). Content can be hard-coded for now, but we’ll structure it to allow fetching or dynamic loading later without major rewrites.