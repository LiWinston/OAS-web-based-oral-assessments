import apiClient from "./apiClient";

const roleMapping = {
  COURSE_ADMIN: "COURSE_ADMIN",
  STUDENT: "STUDENT",
  EXAMINER: "EXAMINER",
  ROLE_ADMIN: "COURSE_ADMIN",
  ROLE_STUDENT: "STUDENT",
  ROLE_EXAMINER: "EXAMINER",
};

export async function verifyOnboardingToken(token) {
  try {
    const response = await apiClient.get("/onboarding/verify", {
      params: { token },
    });

    const payload = response.data?.data ?? response.data ?? {};
    const mappedRole = payload.role
      ? roleMapping[payload.role] || payload.role
      : undefined;

    return {
      success: response.data?.success !== false,
      status: payload.status,
      alreadyRegistered: Boolean(payload.alreadyRegistered),
      role: mappedRole,
      email: payload.email,
      fullName: payload.fullName,
      department: payload.department,
      courseContext: payload.courseContext,
      assignmentContext: payload.assignmentContext,
      message: payload.message,
    };
  } catch (error) {
    const statusCode = error.response?.status;
    if (statusCode === 400 || statusCode === 404) {
      const errPayload =
        error.response?.data?.data ?? error.response?.data ?? {};
      return {
        success: false,
        status: errPayload.status || "invalid",
        message: errPayload.message || "Invalid or expired token",
      };
    }
    throw error;
  }
}

export async function completeOnboarding(data) {
  try {
    const payload = {
      token: data.token,
      name: data.fullName,
      password: data.password,
      department: data.department,
    };

    const response = await apiClient.post("/onboarding/register", payload);
    const result = response.data?.data ?? response.data ?? {};

    if (result.role) {
      result.frontendRole = roleMapping[result.role] || result.role;
    }

    return {
      success: response.data?.success !== false,
      data: result,
    };
  } catch (error) {
    const errData = error.response?.data;
    if (errData) {
      if (errData.success === false && errData.data) {
        throw new Error(
          typeof errData.data === "string"
            ? errData.data
            : errData.message || "Registration failed. Please try again."
        );
      }
      if (errData.message) {
        throw new Error(errData.message);
      }
      if (typeof errData.data === "string") {
        throw new Error(errData.data);
      }
    }
    throw new Error("Registration failed. Please try again.");
  }
}

export async function resendOnboardingInvitation(email) {
  try {
    const response = await apiClient.post("/onboarding/resend", { email });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message;
    if (message) {
      throw new Error(message);
    }
    throw new Error("Failed to resend invitation. Please try again.");
  }
}
