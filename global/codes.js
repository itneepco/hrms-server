module.exports = {
    CL_CODE:'01',
    RH_CODE:'02',
    EL_CODE:'03',
    HPL_CODE:'04',
    HD_CL_CODE:'05',
    
    //Leave Status Codes
    LEAVE_APPLIED:'01',
    LEAVE_APPROVED:'02',
    LEAVE_RECOMMENDED: '03',
    LEAVE_NOT_RECOMMENDED: '04',
    LEAVE_CALLBACKED: '05',

    //Leave cancellation status codes
    LEAVE_CANCELLED: '06',
    LEAVE_CANCEL_INITIATION: '07',
    LEAVE_CANCEL_RECOMMENDED: '08',
    LEAVE_CANCEL_NOT_RECOMMENDED: '09',
    LEAVE_CANCEL_CALLBACKED: '10',

    //Rolemapper codes
    RMAP_EL_HPL: 'RMAPEL',
    TIME_OFFICE_ADMIN: 'RMAPTO',
    VEHICLE_ADMIN: 'RMAPVH',
    TRAINING_ADMIN: 'RMAPTR',
    OM_REP_UPLOADER: 'RMAROM',
    HR_REP_UPLOADER: ' RMARHR',
    FIN_REP_UPLOADER: 'RMARFN',
    HR_LEAVE_SUPER_ADMIN: 'RMASHR',

    //Joining Report Status
    JR_PENDING: '01',
    JR_SUBMITTED: '02',
    JR_RECOMMENDED: '03',
    JR_ACCEPTED: '04',
    JR_CALLBACK: '05',

    //User Roles
    IT_ADMIN_ROLE: 1,
    HR_SUPER_ADMIN_ROLE: 2,
    HR_SITE_ADMIN_ROLE: 3,

    //TRAINING TYPES
    IN_HOUSE_TRAINING: '01',
    EXTERNAL_TRAINING: '02',

    //Training status
    TRAINING_CREATED: '01',
    TRAINING_PUBLISHED: '02',
    TRAINING_COMPLETED: '03',
    TRAINING_DIRECTORY: 'public/uploads/trainings/',

    //Training needs status
    NEEDS_INFO_CREATED: '01',
    NEEDS_INFO_SUBMITTED: '02',
    NEEDS_INFO_RECOMMENDED: '03',
    NEEDS_INFO_RETURNED: '04',

    //ATTENDANCE STATUS
    ATTENDANCE_PRESENT: '01',
    ATTENDANCE_ABSENT: '02',
    ATTENDANCE_HALF_DAY: '03',
    ATTENDANCE_LATE: '04',
    ATTENDANCE_OFF_DAY: '05',
    // Dynamic | Not considered at the time of processing
    ATTENDANCE_HOLIDAY: '06',
    // Dynamic | Not considered at the time of processing
    ATTENDANCE_ABSENT_OFFICIALLY: '07',
    

    // WAGE MONTH STATUS
    WAGE_MONTH_ACTIVE: 1,
    WAGE_MONTH_NEXT: 2,
    WAGE_MONTH_CLOSED: 3

}
