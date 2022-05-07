/* File generated with Shader Minifier 1.2
 * http://www.ctrl-alt-test.fr
 */

export const noise_vert = `uniform mediump vec2 u_Resolution;uniform float u_Amplitude,u_Realtime,u_Seed,u_Speed;uniform vec3 u_BaseColor;uniform struct WaveLayers{vec3 color;bool isSet;float noiseCeil;float noiseFloor;float noiseFlow;vec2 noiseFreq;float noiseSeed;float noiseSpeed;} u_WaveLayers[9];attribute vec3 position;varying vec3 v_Color;void main(){float i=u_Realtime*5e-6;vec2 r=vec2(.00014,.00029),c=u_Resolution*position.xy*r;float y=u_Amplitude*(2./u_Resolution.y),l=t(vec3(c.x*3.+i*3.,c.y*4.,i*10.+u_Seed));l*=1.-pow(abs(position.y),2.);l=max(0.,l);gl_Position=vec4(position.x,position.y+l*y,position.z,1.);v_Color=u_BaseColor;for(int n=0;n<9;n++){if(!u_WaveLayers[n].isSet)break;WaveLayers s=u_WaveLayers[n];float l=t(vec3(c.x*s.noiseFreq.x+i*s.noiseFlow,c.y*s.noiseFreq.y,i*s.noiseSpeed+s.noiseSeed));l=l/2.+.5;l=smoothstep(s.noiseFloor,s.noiseCeil,l);v_Color=o(v_Color,s.color,pow(l,4.));}}
`;

export const color_frag = `precision mediump float;uniform vec2 u_Resolution;uniform float u_ShadowPower;varying vec3 v_Color;void main(){vec3 a=v_Color;vec2 x=gl_FragCoord.xy/u_Resolution.xy;a.y-=pow(x.y+sin(-12.)*x.x,u_ShadowPower)*.4;gl_FragColor=vec4(a,1.);}
`;

export const blend_glsl = `vec3 o(vec3 u,vec3 d,float f){return d*f+u*(1.-f);}
`;

export const snoise_glsl = `vec3 o(vec3 z){return z-floor(z*(1./289.))*289.;}vec4 o(vec4 z){return z-floor(z*(1./289.))*289.;}vec4 e(vec4 z){return o((z*34.+1.)*z);}vec4 v(vec4 w){return 1.79284291400159-.85373472095314*w;}float t(vec3 m){const vec2 p=vec2(1./6.,1./3.);const vec4 C=vec4(0.,.5,1.,2.);vec3 n=floor(m+dot(m,p.yyy)),S=m-n+dot(n,p.xxx),F=step(S.yzx,S.xyz),R=1.-F,g=min(F.xyz,R.zxy),b=max(F.xyz,R.zxy),W=S-g+p.xxx,L=S-b+p.yyy,P=S-C.yyy;n=o(n);vec4 q=e(e(e(n.z+vec4(0.,g.z,b.z,1.))+n.y+vec4(0.,g.y,b.y,1.))+n.x+vec4(0.,g.x,b.x,1.));vec3 h=.142857142857*C.wyz-C.xzx;vec4 B=q-49.*floor(q*h.z*h.z),A=floor(B*h.z),k=floor(B-7.*A),z=A*h.x+h.yyyy,Z=k*h.x+h.yyyy,Y=1.-abs(z)-abs(Z),X=vec4(z.xy,Z.xy),V=vec4(z.zw,Z.zw),U=floor(X)*2.+1.,T=floor(V)*2.+1.,Q=-step(Y,vec4(0.)),O=X.xzyw+U.xzyw*Q.xxyy,N=V.xzyw+T.xzyw*Q.zzww;vec3 M=vec3(O.xy,Y.x),K=vec3(O.zw,Y.y),J=vec3(N.xy,Y.z),I=vec3(N.zw,Y.w);vec4 H=v(vec4(dot(M,M),dot(K,K),dot(J,J),dot(I,I)));M*=H.x;K*=H.y;J*=H.z;I*=H.w;vec4 G=max(.6-vec4(dot(S,S),dot(W,W),dot(L,L),dot(P,P)),0.);G=G*G;return 42.*dot(G*G,vec4(dot(M,S),dot(K,W),dot(J,L),dot(I,P)));}
`;
