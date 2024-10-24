import {
    Body,
    Container,
    Column,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
  } from "@react-email/components"
  import * as React from "react"
  
  interface BrandInfoTemplateProps {
    name: string
    companyType: string
    company: string
    email: string
    phone: string
    message: string
  }
  
  export const BrandInfoTemplate = ({
    name,
    company,
    email,
    phone,
    message,
    companyType,
  }: BrandInfoTemplateProps) => (
    <Html>
      <Head />
      <Preview>A user has requested a demo.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
          </Section>
          <Section style={paragraphContent}>
            <Hr style={hr} />
            <Text style={heading}>REQUEST FOR COLLABORATION WITH PUMPET</Text>
            <Text style={paragraph}>
              A brand has requested to collaborate. Here are the details:
            </Text>
  
            <Text style={paragraphList}>
              <Text style={text}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Name:
                </span>{" "}
                {name}
              </Text>
              <Text style={text}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Builder Type:
                </span>{" "}
                {companyType}
              </Text>
              <Text style={text}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Company:
                </span>{" "}
                {company}
              </Text>
              <Text style={text}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Email:
                </span>{" "}
                <Link href={`mailto:${email}`}>{email}</Link>
              </Text>
              <Text style={text}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Phone:
                </span>{" "}
                <Link href={`tel:${phone}`}>{phone}</Link>
              </Text>
              <Text style={messageStyle}>
                <span
                  style={{
                    fontWeight: "600",
                  }}
                >
                  Message:
                </span>{" "}
                <br /> {message}
              </Text>
            </Text>
          </Section>
          <Section style={paragraphContent}>
            <Hr style={hr} />
          </Section>
          <Section style={{ ...paragraphContent, paddingBottom: 30 }}>
            <Text
              style={{
                ...paragraph,
                fontSize: "12px",
                textAlign: "center",
                margin: 0,
              }}
            >
              You have received this because a brand has requested to collaborate with us.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
  
  BrandInfoTemplate.PreviewProps = {
    name: "John Doe",
    companyType:"Contractor",
    company: "Emendo.AI",
    email: "hey@gmail.com",
    phone: "1234567890",
    message:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  } satisfies BrandInfoTemplateProps
  
  export default BrandInfoTemplate
  
  const main = {
    backgroundColor: "#dbddde",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  }
  
  const text = {
    margin: "0",
  }
  
  const messageStyle = {
    ...text,
    backgroundColor: "#f9f9f9",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "10px",
  }
  
  const container = {
    margin: "30px auto",
    backgroundColor: "#fff",
    borderRadius: 5,
    overflow: "hidden",
  }
  
  const heading = {
    fontSize: "14px",
    lineHeight: "26px",
    fontWeight: "700",
    color: "#004dcf",
  }
  
  const paragraphContent = {
    padding: "0 40px",
  }
  
  const paragraphList = {
    paddingLeft: 40,
  }
  
  const paragraph = {
    fontSize: "14px",
    lineHeight: "22px",
    color: "#3c4043",
  }
  
  const hr = {
    borderColor: "#e8eaed",
    margin: "10px 0",
  }
  