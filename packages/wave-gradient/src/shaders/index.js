/* File generated with Shader Minifier 1.2
 * http://www.ctrl-alt-test.fr
 */

export const noise_vert = `uniform mediump vec2 u_Resolution;uniform float u_Amplitude,u_Realtime,u_Seed,u_Speed;uniform vec3 u_BaseColor;uniform struct WaveLayers{vec3 color;bool isSet;float noiseCeil;float noiseFloor;float noiseFlow;vec2 noiseFreq;float noiseSeed;float noiseSpeed;} u_WaveLayers[9];attribute vec3 position;varying vec3 v_Color;void main(){float e=u_Realtime*5e-6;vec2 o=vec2(.00014,.00029),t=u_Resolution*position.xy*o;float i=u_Amplitude*(2./u_Resolution.y),v=snoise(vec3(t.x*3.+e*3.,t.y*4.,e*10.+u_Seed));v*=1.-pow(abs(position.y),2.);v=max(0.,v);gl_Position=vec4(position.x,position.y+v*i,position.z,1.);v_Color=u_BaseColor;for(int r=0;r<9;r++){if(!u_WaveLayers[r].isSet)break;WaveLayers l=u_WaveLayers[r];float v=snoise(vec3(t.x*l.noiseFreq.x+e*l.noiseFlow,t.y*l.noiseFreq.y,e*l.noiseSpeed+l.noiseSeed));v=v/2.+.5;v=smoothstep(l.noiseFloor,l.noiseCeil,v);v_Color=blendNormal(v_Color,l.color,pow(v,4.));}}
`;

export const color_frag = `precision mediump float;uniform vec2 u_Resolution;uniform float u_ShadowPower;varying vec3 v_Color;void main(){vec3 n=v_Color;vec2 c=gl_FragCoord.xy/u_Resolution.xy;n.y-=pow(c.y+sin(-12.)*c.x,u_ShadowPower)*.4;gl_FragColor=vec4(n,1.);}
`;

export const blend_glsl = `vec3 blendNormal(vec3 y,vec3 s,float u){return s*u+y*(1.-u);}
`;

export const snoise_glsl = `vec3 mod289(vec3 a){return a-floor(a*(1./289.))*289.;}vec4 mod289(vec4 a){return a-floor(a*(1./289.))*289.;}vec4 permute(vec4 a){return mod289((a*34.+1.)*a);}vec4 taylorInvSqrt(vec4 d){return 1.79284291400159-.85373472095314*d;}float snoise(vec3 x){const vec2 m=vec2(1./6.,1./3.);const vec4 f=vec4(0.,.5,1.,2.);vec3 r=floor(x+dot(x,m.yyy)),z=x-r+dot(r,m.xxx),p=step(z.yzx,z.xyz),w=1.-p,S=min(p.xyz,w.zxy),C=max(p.xyz,w.zxy),b=z-S+m.xxx,F=z-C+m.yyy,g=z-f.yyy;r=mod289(r);vec4 R=permute(permute(permute(r.z+vec4(0.,S.z,C.z,1.))+r.y+vec4(0.,S.y,C.y,1.))+r.x+vec4(0.,S.x,C.x,1.));vec3 L=.142857142857*f.wyz-f.xzx;vec4 W=R-49.*floor(R*L.z*L.z),q=floor(W*L.z),P=floor(W-7.*q),a=q*L.x+L.yyyy,G=P*L.x+L.yyyy,h=1.-abs(a)-abs(G),O=vec4(a.xy,G.xy),N=vec4(a.zw,G.zw),I=floor(O)*2.+1.,B=floor(N)*2.+1.,A=-step(h,vec4(0.)),E=O.xzyw+I.xzyw*A.xxyy,k=N.xzyw+B.xzyw*A.zzww;vec3 Z=vec3(E.xy,h.x),Y=vec3(E.zw,h.y),X=vec3(k.xy,h.z),V=vec3(k.zw,h.w);vec4 U=taylorInvSqrt(vec4(dot(Z,Z),dot(Y,Y),dot(X,X),dot(V,V)));Z*=U.x;Y*=U.y;X*=U.z;V*=U.w;vec4 T=max(.6-vec4(dot(z,z),dot(b,b),dot(F,F),dot(g,g)),0.);T=T*T;return 42.*dot(T*T,vec4(dot(Z,z),dot(Y,b),dot(X,F),dot(V,g)));}
`;
