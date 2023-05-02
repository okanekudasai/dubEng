import { useState, useEffect } from "react";
import useGetVideoInfoQuery from "@/apis/manager/queries/useGetVideoInfoQuery";
import ScriptListItem from "@/features/manager/organism/ScriptListItem";
import useCategoryQuery from "@/apis/manager/queries/useCategoryQuery";
import CommonInputBox from "@/components/atoms/CommonInputBox";
import TagButton from "@/components/atoms/TagButton";

export default function ManagerPage() {
  const [inputs, setInputs] = useState({
    url: "",
    start: 0,
    end: 0,
    lang: "",
  });

  // const scripts = [
  //   {
  //     duration: 1.126,
  //     start: 49.007,
  //     text: "Oh, my God. He's..",
  //     translation: "맙소사.  그는..",
  //   },
  //   {
  //     duration: 1.836,
  //     start: 50.216,
  //     text: "Look at the way\nhe's just staring at me.",
  //     translation: "\n나를 쳐다보는 것 좀 봐.",
  //   },
  //   {
  //     duration: 1.502,
  //     start: 53.219,
  //     text: "I think he's tryin'\nto mouth something at me",
  //     translation:
  //       "그가\n나에게 뭔가를 입으로 말하려는 것 같은데 알아들을 수가",
  //   },
  //   {
  //     duration: 1.335,
  //     start: 54.804,
  //     text: "but I can't make it out.",
  //     translation: "없네요.",
  //   },
  //   {
  //     duration: 1.627,
  //     start: 60.393,
  //     text: "Okay, dinner's ready.",
  //     translation: "좋아, 저녁 준비 됐어.",
  //   },
  //   {
  //     duration: 1.21,
  //     start: 62.103,
  //     text: "- Good game.\n- Yeah.",
  //     translation: "- 좋은 경기.\n- 응.",
  //   },
  //   {
  //     duration: 1.669,
  //     start: 63.354,
  //     text: "Yeah, solid effort,\nsolid effort.",
  //     translation: "그래, 확실한 노력,\n확실한 노력.",
  //   },
  // ];

  interface getVideoInfoType {
    channelTitle: string;
    thumbnails: string;
    title: string;
    url: string;
  }

  // 채워넣기 용 비디오 info
  const [videoInfo, setVideoInfo] = useState<getVideoInfoType>();

  interface scriptsType {
    duration: number;
    start: number;
    text: string;
    translation: string;
  }

  // script 정보 관리하는 useState
  const [scripts, setScripts] = useState<scriptsType[]>([]);

  // // post용 다중 requestbody 값 저장 객체
  // const [videoInfo, setVideoInfo] = useState({});

  // 비구조화 할당
  const { url, start, end, lang } = inputs;

  // get용 react-query
  const { refetch } = useGetVideoInfoQuery(url, start, end, lang);

  // // 카테고리 조회 react-query
  const { data } = useCategoryQuery();

  // 선택한 카테고리 태그
  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  // 태그 선택
  const handleClickTag = (name: string) => {
    if (selectedTag.includes(name)) {
      setSelectedTag(selectedTag.filter((tagName) => tagName !== name));
    } else {
      setSelectedTag([...selectedTag, name]);
    }
  };

  // input값 onChange
  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setInputs({
      ...inputs,
      [name]: value,
    });
  };

  // getVideoInfo 쿼리 호출 파트
  async function getVideoInfo() {
    console.log("getVideoInfo");
    try {
      const videoInfoResult = await refetch();
      console.log("videoInfoResult", videoInfoResult);
      setVideoInfo(videoInfoResult.data.vedioInfo);
      setScripts(videoInfoResult.data.scripts);
    } catch (error) {
      console.log(error);
    }
  }
  // url 퍼가기 용으로 수정
  const getIframeUrl = () => {
    if (videoInfo) {
      const originalUrl = videoInfo.url;
      const splitUrl = originalUrl.split("watch?v=");
      const newUrl =
        splitUrl[0] +
        "embed/" +
        splitUrl[1] +
        "?start=" +
        start +
        "&end=" +
        end +
        "&controls=0&rel=0&loop=1";

      console.log(newUrl);
      return newUrl;
    }
  };

  // 요청 보내는 파트
  function handleGetVideoButton() {
    console.log(inputs);
    getVideoInfo();
  }

  function handleSaveVideo() {
    console.log("등록하기 버튼 눌렀다!");
  }

  return (
    <div>
      <p className="text-24 font-bold">더빙 콘텐츠 불러오기</p>
      <div className="flex">
        <div>
          <label htmlFor="url">비디오 링크</label>
          <br />
          <CommonInputBox
            type="text"
            name="url"
            value={url}
            placeholder="비디오 url을 입력하세요."
            onChange={onChangeValue}
          />
        </div>
        <div>
          <label htmlFor="videoInterval">비디오 구간 설정</label>
          <br />
          <CommonInputBox
            type="number"
            name="start"
            value={start}
            placeholder="시작 시간"
            onChange={onChangeValue}
          />
          ~
          <CommonInputBox
            type="number"
            name="end"
            value={end}
            placeholder="종료 시간"
            onChange={onChangeValue}
          />
        </div>
        <div>
          <label htmlFor="lang">언어</label>
          <br />
          <div>
            <label htmlFor="english">English</label>
            <input
              type="radio"
              value="english"
              id="english"
              name="lang"
              onChange={onChangeValue}
            />
            <label htmlFor="korean">한국어</label>
            <input
              type="radio"
              value="korean"
              id="korean"
              name="lang"
              onChange={onChangeValue}
            />
          </div>
        </div>
        <button
          className="rounded-[8px] bg-dubblue px-16"
          onClick={handleGetVideoButton}
        >
          불러오기
        </button>
      </div>
      <p className="text-24 font-bold">더빙 콘텐츠 정보</p>
      {videoInfo && (
        <div>
          <p>콘텐츠 미리보기</p>
          <iframe src={getIframeUrl()}></iframe>

          <p>썸네일</p>
          <img src={videoInfo!.thumbnails} alt="videoThumbnails" />

          <label htmlFor="videoTitle">콘텐츠 제목</label>
          <input type="text" value={videoInfo!.title} />

          <label htmlFor="videoRuntime">런타임</label>
          <input type="number" value={end - start} />

          {/* <label htmlFor="videoLanguage">영상 언어</label>
          <br />
          <div>
            <label htmlFor="english">English</label>
            <input
              type="radio"
              value="english"
              id="english"
              name="lang"
              onChange={onChangeValue}
            />
            <label htmlFor="korean">한국어</label>
            <input
              type="radio"
              value="korean"
              id="korean"
              name="lang"
              onChange={onChangeValue}
            />
          </div> */}

          {/* <label htmlFor="videoLanguage">더빙 성우 성별</label>
          <br />
          <div>
            <label htmlFor="male">남성</label>
            <input
              type="radio"
              value="male"
              id="male"
              name="gender"
              onChange={onChangeValue}
            />
            <label htmlFor="female">여성</label>
            <input
              type="radio"
              value="female"
              id="female"
              name="gender"
              onChange={onChangeValue}
            />
          </div> */}

          <label htmlFor="videoProduction">제작사</label>
          <input type="text" value={videoInfo!.channelTitle} />

          <p className="text-24 font-bold">스크립트</p>
          {scripts.map((script, idx) => (
            <ScriptListItem {...script} key={idx} />
          ))}
        </div>
      )}

      <p className="text-24 font-bold">콘텐츠 정보 입력하기</p>
      <label htmlFor="videoLanguage">더빙 성우 성별</label>
      <br />
      <div>
        <label htmlFor="male">남성</label>
        <input
          type="radio"
          value="male"
          id="male"
          name="gender"
          onChange={onChangeValue}
        />
        <label htmlFor="female">여성</label>
        <input
          type="radio"
          value="female"
          id="female"
          name="gender"
          onChange={onChangeValue}
        />
      </div>
      <p>카테고리</p>
      <div className="flex">
        {data?.map((tag: { id: number; name: string }, idx: number) => (
          <div onClick={() => handleClickTag(tag.name)}>
            <TagButton
              onClick={() => handleClickTag(tag.name)}
              id={tag.id}
              key={idx}
              name={tag.name}
              isSelected={selectedTag.includes(tag.name) ? true : false}
            />
          </div>
        ))}
      </div>
      <p>음성 파일 첨부</p>
      <button
        className="rounded-[8px] bg-dubblue px-16"
        onClick={handleSaveVideo}
      >
        등록하기
      </button>
    </div>
  );
}
