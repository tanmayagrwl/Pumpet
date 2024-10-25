export const GET = async () => {
  const res = await fetch("http://localhost:5050/api/v1/auth/jira/signup?r=1", {
    method: "POST",
  });

  if (!res.ok) {
    return Response.redirect("/error?e=FAILED_TO_CONNECT_TO_JIRA");
  }

  const data = await res.json();
  return Response.redirect(data.authUrl);
};
