export const buildUserDoc = ({ name, email, password, role, verificationToken }) => {

    return {
        name: name.trim(),
        email,
        password,
        role: "user",
        isVerified: false,
        verificationToken,
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

