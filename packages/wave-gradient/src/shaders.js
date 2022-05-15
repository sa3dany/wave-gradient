/* File generated with Shader Minifier 1.2
 * http://www.ctrl-alt-test.fr
 */

export const noise_vert = `#version 300 es
uniform mediump vec2 u_Resolution;uniform float u_Amplitude,u_Realtime,u_Seed,u_Speed;uniform vec3 u_BaseColor;uniform struct WaveLayers{vec3 color;bool isSet;float noiseCeil;float noiseFloor;float noiseFlow;vec2 noiseFreq;float noiseSeed;float noiseSpeed;} u_WaveLayers[9];in vec3 a_Position;out vec3 v_Color;void main(){float c=u_Realtime*5e-6;vec2 t=vec2(.00014,.00029),l=u_Resolution*a_Position.xy*t;float r=u_Amplitude*(2./u_Resolution.y),n=v(vec3(l.x*3.+c*3.,l.y*4.,c*10.+u_Seed));n*=1.-pow(abs(a_Position.y),2.);n=max(0.,n);gl_Position=vec4(a_Position.x,a_Position.y+n*r,a_Position.z,1.);v_Color=u_BaseColor;for(int s=0;s<9;s++){if(!u_WaveLayers[s].isSet)break;WaveLayers y=u_WaveLayers[s];float n=v(vec3(l.x*y.noiseFreq.x+c*y.noiseFlow,l.y*y.noiseFreq.y,c*y.noiseSpeed+y.noiseSeed));n=n/2.+.5;n=smoothstep(y.noiseFloor,y.noiseCeil,n);v_Color=o(v_Color,y.color,pow(n,4.));}}
`;

export const color_frag = `#version 300 es
precision mediump float;uniform vec2 u_Resolution;uniform float u_ShadowPower;in vec3 v_Color;out vec4 color;void main(){vec2 u=gl_FragCoord.xy/u_Resolution.xy;color=vec4(v_Color,1.);color.y-=pow(u.y+sin(-12.)*u.x,u_ShadowPower)*.4;}
`;

export const blend_glsl = `vec3 o(vec3 a,vec3 x,float d){return x*d+a*(1.-d);}
`;

export const snoise_glsl = `vec3 o(vec3 f){return f-floor(f*(1./289.))*289.;}vec4 o(vec4 f){return f-floor(f*(1./289.))*289.;}vec4 e(vec4 f){return o((f*34.+1.)*f);}vec4 i(vec4 z){return 1.79284291400159-.85373472095314*z;}float v(vec3 w){const vec2 m=vec2(1./6.,1./3.);const vec4 p=vec4(0.,.5,1.,2.);vec3 s=floor(w+dot(w,m.yyy)),S=w-s+dot(s,m.xxx),C=step(S.yzx,S.xyz),P=1.-C,F=min(C.xyz,P.zxy),R=max(C.xyz,P.zxy),L=S-F+m.xxx,b=S-R+m.yyy,W=S-p.yyy;s=o(s);vec4 g=e(e(e(s.z+vec4(0.,F.z,R.z,1.))+s.y+vec4(0.,F.y,R.y,1.))+s.x+vec4(0.,F.x,R.x,1.));vec3 G=.142857142857*p.wyz-p.xzx;vec4 q=g-49.*floor(g*G.z*G.z),h=floor(q*G.z),O=floor(q-7.*h),f=h*G.x+G.yyyy,B=O*G.x+G.yyyy,A=1.-abs(f)-abs(B),E=vec4(f.xy,B.xy),k=vec4(f.zw,B.zw),Z=floor(E)*2.+1.,Y=floor(k)*2.+1.,X=-step(A,vec4(0.)),V=E.xzyw+Z.xzyw*X.xxyy,U=k.xzyw+Y.xzyw*X.zzww;vec3 T=vec3(V.xy,A.x),Q=vec3(V.zw,A.y),N=vec3(U.xy,A.z),M=vec3(U.zw,A.w);vec4 K=i(vec4(dot(T,T),dot(Q,Q),dot(N,N),dot(M,M)));T*=K.x;Q*=K.y;N*=K.z;M*=K.w;vec4 J=max(.6-vec4(dot(S,S),dot(L,L),dot(b,b),dot(W,W)),0.);J=J*J;return 42.*dot(J*J,vec4(dot(T,S),dot(Q,L),dot(N,b),dot(M,W)));}
`;
