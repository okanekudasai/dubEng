import { MdArrowForwardIos } from "react-icons/md";

interface Iprops {
  page: string;
}

export default function DubButton({ page }: Iprops) {
  if (page === "/community/shorts") {
    return (
      <button className="flex text-14 rounded-20 p-6 pl-16 pr-10 border-1 border-dubgraylight font-semibold text-dubgraylight">
        <div className="flex justify-center items-center">
          <p>더빙하기</p>
          <MdArrowForwardIos size={16} color="dubgray" />
        </div>
      </button>
    );
  } else {
    return (
      <button className="flex justify-center rounded-20 p-6 w-96 h-29 p-3 border-dubgray border-1 font-semibold text-dubgray">
        <div className="flex justify-center items-center">
          <p className="text-14">더빙하기</p>
          <MdArrowForwardIos size={16} color="dubgray" />
        </div>
      </button>
    );
  }
}
