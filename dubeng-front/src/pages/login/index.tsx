import Image from "next/image";
import DubLogoImage from "../../../public/images/logo/dubeng_logo.png";
import LoginBtnImage from "../../../public/images/login/kakao_login_medium_wide.png";
import Script from "next/script";

declare global {
  interface Window{
    Kakao:any;
  }
}

export default function LogInPage(){
  const loginHandler = () =>{
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    if(!window.Kakao.isInitialized()){
      window.Kakao.init(jsKey);
      
      window.Kakao.Auth.authorize({
        redirectUri: redirectUri
      });
    }
  }

  return (
  <div className="container mx-auto">
    <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.1.0/kakao.min.js" defer></Script>
    <div>
      <div>
        <Image className="mx-auto" src={DubLogoImage} alt="dubLogoImg"  width={120} height={60}></Image>
        <p className="text-dubgray text-xs text-center my-5">더빙으로 즐거움이 더블</p>
      </div>
      <div onClick={loginHandler}>
        <Image className="mx-auto" src={LoginBtnImage} alt="kakaoLoginBtn" width={350}></Image>
      </div>
    </div>
  </div>
  );
}