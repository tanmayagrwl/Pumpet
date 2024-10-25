"use server";

import axios from "axios";
import { cookies } from 'next/headers'

export  const  getIssues = async () => {
    const cookieStore = await cookies();
    const JAT = cookieStore.get('jira_access_token');
    const token = JAT?.value;

  try {
    const response = await axios.get(
      "http://localhost:5050/api/v1/jira/projects/cbc17885-f5d9-4d39-8117-038eedef45e5/project/CRM/issues",{
        "headers": {
            "Authorization": `Bearer ${token}`,
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
