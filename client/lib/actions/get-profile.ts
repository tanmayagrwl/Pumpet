"use server";

import axios from "axios";
import { cookies } from 'next/headers'

export  const  getUserProfile = async () => {
    const cookieStore = await cookies()
    const JAT = cookieStore.get('jira_access_token')
  try {
    const response = await axios.get(
      "http://localhost:5050/api/v1/auth/jira/profile",{
        "headers": {
            "Authorization": `Bearer ${JAT?.value}`,
            }
      }
    );
    console.trace("this is JAT in tryyy", JAT?.value);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
