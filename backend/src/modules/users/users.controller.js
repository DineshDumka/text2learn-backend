const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        quota: true, // Include quota so frontend can show "Credits remaining"
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(ApiResponse.success(userWithoutPassword));
  } catch (error) {
    res.status(500).json(ApiResponse.error("Failed to fetch profile"));
  }
};
