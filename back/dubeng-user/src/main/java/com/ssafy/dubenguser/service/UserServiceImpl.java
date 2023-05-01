package com.ssafy.dubenguser.service;

import com.ssafy.dubenguser.dto.*;
import com.ssafy.dubenguser.entity.Category;
import com.ssafy.dubenguser.entity.User;
import com.ssafy.dubenguser.entity.UserCalender;
import com.ssafy.dubenguser.exception.DuplicateException;
import com.ssafy.dubenguser.exception.InvalidInputException;
import com.ssafy.dubenguser.exception.NotFoundException;
import com.ssafy.dubenguser.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;


    /**
     *
     */
    public void save(UserJoinReq requestDTO){
        if(isExistNickname(requestDTO.getNickname()))
            throw new DuplicateException("이미 등록된 닉네임입니다.");

//        userRepository.save(new User())
    }

    /**
     *  DB로 부터 이미 등록된 회원인지 확인
     *  false : 등록된 회원이 없다.
     *  true : 등록된 회원이 있다.
     */
    public boolean checkEnrolledMember(Long id){

        Optional<User> member = userRepository.findById(id);

        // Null = 회원이 없다는 뜻.
        if(!member.isPresent()) return false;

        log.debug("회원 있어유~");
        return true;
    }

    public boolean isExistNickname(String nickname) {
        Optional<User> user = userRepository.findByNickname(nickname);

        if (user.isPresent()){  // 이미 닉네임 존재
            return true;
        }

        return false;
    }

    @Transactional
    public UserProfileRes getProfile(Long id) {
        Optional<User> user = userRepository.findById(id);

        if(!user.isPresent()) {
            throw new NotFoundException("존재하지 않는 유저입니다!");
        }

        List<Category> categories = userRepository.findCategoriesByUserId(user.get().getId());

        List<UserCategoryRes> categoryList = new ArrayList<>();

        for(Category c: categories) {
            UserCategoryRes res = new UserCategoryRes();
            res.setCategoryName(c.getName());
            categoryList.add(res);
        }

        UserProfileRes result = UserProfileRes.builder()
                .totalRecTime(user.get().getTotalRecTime())
                .recordCount(user.get().getRecordCount())
                .category(categoryList)
                .build();

        return result;
    }

    @Transactional
    public UserCalenderRes getCalender(Long userId) {
        ZonedDateTime today = ZonedDateTime.now();
        ZonedDateTime startDate = today.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        ZonedDateTime endDate = today.withDayOfMonth(today.getMonth().maxLength()).withHour(23).withMinute(59).withSecond(59).withNano(999_999_999);

        List<UserCalender> userCalendars = userRepository.findCalenderByUserId(userId, startDate, endDate);
        List<ZonedDateTime> res = new ArrayList<>();

        for(UserCalender uc: userCalendars) {
            res.add(uc.getCalDate());
        }

        UserCalenderRes result = new UserCalenderRes();
        result.setDates(res);

        return result;
    }

    @Transactional
    public List<UserRecordRes> getRecords(Long userId, UserRecordReq request) {
        if(request.getIsPublic()==null || request.getIsLimit()==null || request.getLanType()==null)
            throw new InvalidInputException("모든 값을 채워주세요!");

        List<UserRecordRes> result = userRepository.findRecordByUserId(userId, request.getIsPublic(), request.getIsLimit(), request.getLanType());
        return result;
    }

    @Transactional
    public List<UserLikedRecordRes> getLikedRecords(Long userId, Boolean isLimit) {
        List<UserLikedRecordRes> result = userRepository.findLikedRecordByUserId(userId, isLimit);
        return result;
    }

    @Transactional
    public List<UserBookmarkedVideoRes> getBookmarkedVideos(Long userId, Boolean isLimit) {
        List<UserBookmarkedVideoRes> result = userRepository.findBookmarkedVideoByUserId(userId, isLimit);
        return result;
    }

}