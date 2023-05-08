package com.ssafy.dubenguser.controller;

import com.ssafy.dubenguser.dto.*;
import com.ssafy.dubenguser.entity.User;
import com.ssafy.dubenguser.service.UserServiceImpl;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.models.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;


@Slf4j
@RestController
@RequestMapping("/mypage")
@RequiredArgsConstructor
@Api("마이페이지 API")
public class UserController {
    private final UserServiceImpl userService;
    private static final String SUCCESS = "success";
    private static final String FAIL = "fail";

    @ApiOperation(value = "프로필 보여주기")
    @GetMapping()
    public ResponseEntity<UserProfileRes> getUserProfile(HttpServletRequest httpServletRequest) {
        User user = (User) httpServletRequest.getAttribute("user");
        UserProfileRes result = userService.getProfile(user.getId());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @ApiOperation(value = "캘린더 날짜 보여주기")
    @GetMapping("/calendar")
    public ResponseEntity<UserCalenderRes> getUserCalendar(HttpServletRequest httpServletRequest) {
        User user = (User) httpServletRequest.getAttribute("user");
        UserCalenderRes result = userService.getCalender(user.getId());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @ApiOperation(value = "더빙 목록 보여주기")
    @PostMapping("/recordList")
    public ResponseEntity<List<UserRecordRes>> getUserRecordList(HttpServletRequest httpServletRequest, @RequestBody UserRecordReq request) {
        User user = (User) httpServletRequest.getAttribute("user");
        List<UserRecordRes> recordList = userService.getRecords(user.getId(), request);
        return new ResponseEntity<>(recordList, HttpStatus.OK);
    }

    @ApiOperation(value = "좋아요 누른 더빙 목록 보여주기")
    @GetMapping("/recordLikeList/{isLimit}")
    public ResponseEntity<List<UserLikedRecordRes>> getUserRecordList(HttpServletRequest httpServletRequest, @PathVariable Boolean isLimit) {
        User user = (User) httpServletRequest.getAttribute("user");
        List<UserLikedRecordRes> recordList = userService.getLikedRecords(user.getId(), isLimit);
        return new ResponseEntity<>(recordList, HttpStatus.OK);
    }

    @ApiOperation(value = "북마크 비디오 보여주기")
    @GetMapping("/bookmark/{isLimit}")
    public ResponseEntity<List<UserBookmarkedVideoRes>> getUserBookmarkList(HttpServletRequest httpServletRequest, @PathVariable Boolean isLimit) {
        User user = (User) httpServletRequest.getAttribute("user");
        List<UserBookmarkedVideoRes> bookmarkList = userService.getBookmarkedVideos(user.getId(), isLimit);
        return new ResponseEntity<>(bookmarkList, HttpStatus.OK);
    }
}
