exports.handler = async (event) => {
  console.log("🚨 High-value deposit Lambda triggered.");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "High-value deposit handled." }),
  };
};

