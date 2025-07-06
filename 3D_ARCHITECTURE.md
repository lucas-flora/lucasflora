# Info on how to structure the 3D pipeline
## High Level:
Core react app experience (retro-future terminal, very simple for MVP) >
rendered onto a canvas texture (offscreen canvas?) >
3D scene with a crt monitor (screen plane, parametric geometry around border of window for monitor housing) >
use terminal app canvas as emissive material on plane so it looks like terminal app is on screen >
apply shader effects like scan lines and convex curvature to screen texture >
apply post processing shader to entire seen (mainly light bloom for now) for realistic glow from screen and any other light sources

### 3D implementation details
1. Enclosure Geometry
	•	Rounded-box base
	•	Use a single RoundedBox (from @react-three/drei) for the main housing.
	•	Tie its width and height to the window’s aspect ratio, with a fixed depth (e.g. 0.3 units).
	•	Fillet radius: ~5–10% of the smaller dimension to get those soft, retro curves.
	•	Inset bezel
	•	Subtract (or overlay) a slightly smaller rounded box for the bezel opening.
	•	Depth inset: ~2–3% of housing depth.
	•	Bezel thickness: ~5–8% of the screen width.

```
<RoundedBox args={[w, h, d]} radius={r} smoothness={16}>
  <meshStandardMaterial color="#E3E0D8" /> {/* off-white plastic */}
  <RoundedBox args={[w*0.9, h*0.9, d*0.02]} radius={r*0.5} position={[0,0,d/2 - 0.01]}>
    <meshStandardMaterial color="#111111" /> {/* dark bezel */}
  </RoundedBox>
</RoundedBox>
```

2. Curved Screen Plane
	•	Geometry
	•	Start with a subdivided planeGeometry (e.g. 64×64 segments).
	•	In your vertex shader (WGSL) or via a small displacement, push all screen vertices along their normal by sin(uv.x*π) * curvatureAmount.
	•	Curvature amount: ~0.02–0.05 units for a gentle bow.
	•	Material
	•	Use an emissive ShaderMaterial (WGSL) that samples your terminal‐canvas texture.
	•	Background color: pure black (#000000)
	•	Text color: high-contrast (bright green #0F0 or white #FFF)

⸻

3. Shader & Post-Processing
	•	CRT Shader
	•	Scanlines: in fragment shader, do
```
let yLine = floor(uv.y * screenHeight);
let dim = select(1.0, 0.8, (mod(yLine, 2.0) < 1.0));
color.rgb *= dim;
```
  •	Subtle vignette: multiply color by smoothstep(0.9, 0.5, distance(uv, vec2(0.5))).

	•	Global Bloom
	•	Render the scene into a bloom pass so the screen and any emissive LEDs “bleed” softly.
	•	Bloom threshold: ~1.0; strength: ~0.5–1.0.

⸻

4. Materials & Lighting
	•	Housing: MeshPhysicalMaterial
	•	BaseColor: Off-white / light gray (#E3E0D8).
	•	Roughness: 0.6–0.8 (semi-matte plastic).
	•	Clearcoat: 0.1–0.2 for slight sheen.
	•	Bezel: pure black (#111111), roughness ~0.5.
	•	LED: tiny sphere with MeshBasicMaterial({ color: '#0F0', toneMapped:false }) so it’s always bright—and let bloom do the rest.
	•	Lights: very low‐level ambient (0.1) + a single distant directional or spotlight (positioned above/behind camera) so the housing reads its shape, but doesn’t outshine the screen.

⸻

5. Detail Accents (Optional)
	•	Screws: small cylinders or hex bolts at each bezel corner (parametric positions).
	•	Knob or switch: a short cylinder on the right side of the bezel, rotated 90°; use a darker gray for contrast.
	•	Vents: thin boxes or extruded shapes on top/back of housing, if you want more realism.

⸻

6. Scene & UX
	• Monitor takes up entire view. Mostly with screen, and a certain amount given to the monitor housing
	•	Camera: front-on orthographic or narrow-FOV perspective so the monitor fills entire view.
	•	Interaction: capture key events only when the canvas is focused, so clicks/drags outside the screen can pan/rotate slightly if you add that later.
	•	Contrast tuning: keep ambient light minimal so the text “pops”—your shader’s emissive intensity plus bloom should make the screen the brightest element.

⸻

Why This Works
	•	Fully parametric: geometry sizes update automatically on resize.
	•	High contrast: black-background + bright text + bloom = immediate focus on content.
	•	Retro authenticity: curvature, scanlines, and a little physical detail bring vintage flair without an asset pipeline.
	•	Modular & React-friendly: all pieces are React components (R3F + drei), so you can swap materials or add new details as you iterate.

With these building blocks, you’ll get a clean, vintage-looking 3D monitor that highlights your terminal UI just as you envisioned—bright text on deep black, all driven by code.