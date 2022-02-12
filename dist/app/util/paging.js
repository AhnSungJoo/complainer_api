"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function getPaging(_curPage, article_length) {
    return __awaiter(this, void 0, void 0, function* () {
        // 페이지당 게시물 수 : 현 페이지 당 10개 게시물
        let page_size = 15;
        // 보여지는 페이지의 갯수 : 1 ~ 10 페이지
        let page_list_size = 5;
        // limit 변수
        let no;
        let totalArtilceCount = 0; // 전체 게시물의 수
        // let data = article_data; // 게시물 수를 저장하는 변수 
        totalArtilceCount = article_length;
        let curPage = _curPage;
        // console.log("현재 페이지 : " + curPage, "전체 페이지 : " + totalArtilceCount);
        // 전체 페이지 갯수 
        if (totalArtilceCount < 0)
            totalArtilceCount = 0;
        let totalPage = Math.ceil(totalArtilceCount / page_size); // all page number
        let totalSet = Math.ceil(totalArtilceCount / page_list_size); // all set number
        let curSet = Math.ceil(curPage / page_list_size); // current set number
        let startPage = ((curSet - 1) * page_list_size) + 1;
        let endPage = (startPage + page_list_size) - 1;
        if (curPage < 0)
            no = 0;
        else
            no = (curPage - 1) * page_size;
        // console.log('[0] curPage : ' + curPage + ' | [1] page_list_size : ' + page_list_size + ' | [2] page_size : ' + page_size + ' | [3] totalPage : ' + totalPage + ' | [4] totalSet : ' + totalSet + ' | [5] curSet : ' + curSet + ' | [6] startPage : ' + startPage + ' | [7] endPage : ' + endPage);
        let result2 = {
            "curPage": curPage,
            "page_list_size": page_list_size,
            "page_size": page_size,
            "totalPage": totalPage,
            "totalSet": totalSet,
            "curSet": curSet,
            "startPage": startPage,
            "endPage": endPage,
            "no": no
        };
        return result2;
    });
}
exports.getPaging = getPaging;
