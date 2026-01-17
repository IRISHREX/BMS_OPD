import React, { useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { dobToAge } from "../utils/ageUtils";


const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : ""; // dd/mm/yyyy

// Create styles
const styles = StyleSheet.create({
  // A4 paper size is 210 millimeters by 297 millimeters
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    margin: "0mm",
    fontSize: "10pt",
  },
  header_section: {
    margin: "0mm",
    padding: 0,
    flexGrow: 1,
    maxHeight: "50mm",
    width: "210mm",
  },
  header_image: {
    width: "100%",
  },
  main_section: {
    marginHorizontal: "10mm",
    marginBottom: "55mm",
    padding: "2mm",
    flexGrow: 1,
    border: "1 solid #000",
    borderBottom: "0 solid #000",
    height: "172mm",
    width: "190mm",
    textAlign: "justify",
  },
  footer_section: {
    margin: "0mm",
    padding: "0mm",
    flexGrow: 1,
    maxHeight: "15mm",
    width: "210mm",
    position: "absolute",
    bottom: "0mm",
  },
  footer_image: {
    width: "100%",
  },
  upper_box: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
    paddingBottom: "2mm",
  },
  upper_left: {
    width: "75%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  personal_details: {
    display: "flex",
    flexDirection: "row",
    gap: "1mm"
  },
  upper_right: {
    width: "25%",
  },
  pData: {
    marginTop: "2mm",
    marginBottom: "4mm",
  },
  gravida_vitals: {
    marginTop: "2mm",
    marginBottom: "3mm"
  },
  gravida_section:{
    flexDirection: "row",
    gap: "4mm",
  },
  vitals_section:{
    marginTop: "2mm",
    flexDirection: "row",
    gap: "4mm",
  },
  heading_values: {
    flexDirection: "row",
    gap: "1mm"
  },
  heading:{
    fontWeight: "bold",
  },
  rxLogo: {
    width: 24,
  },
  med_advice: {
    display: "flex",
    flexDirection: "column",
    border: "1 solid #ccc",
  },
  medic_header: {
    flexDirection: "row",
    gap: "1mm",
    fontWeight: "bold",
    backgroundColor: "#c0c7cf",
    padding: "1mm"
  },
  medic_row: {
    flexDirection: "row",
    gap: "1mm",
    padding: "1mm",
    borderTop: "1 solid #ccc",
  },
  seal: {
    position: "absolute",
    bottom: "15mm",
    marginHorizontal: "10mm",
    border: "1 solid #000",
    width: "190mm",
    height: "40mm",
    flexDirection: "row",
    padding: "2mm",
  },
  seal_left: {
    width: "65%",
    gap: "1mm"
  },
  seal_right: {
    width: "35%",
    height: "100%",
    fontSize: "12pt",
    display: "flex",
    justifyContent: "flex-end",
    textAlign: "right",
    paddingRight: "5mm",
    paddingBottom: "2mm",
  },
});
// Create Document Component
const MyDocument = ({ header, footer, p_data, dr_data, report }) => {
  console.log("In MyDocument:", header, footer, p_data, dr_data, report);
  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header_section} fixed>
        <Image style={styles.header_image} src="/G.Jakaria_header.png" />
      </View>
      <View style={styles.main_section}>
        <View style={styles.upper_box}>
          <View style={styles.upper_left}>
            <View style={styles.personal_details}>
              <Text style={styles.heading}>{p_data.name},</Text>
              <Text>{p_data.gender},</Text>
              <Text>{p_data.dob
                        ? dobToAge(p_data.dob)
                        : p_data.age
                        ? `${p_data.age} years`
                        : ""}
              </Text>
              { p_data.phone && <Text>,+91{p_data.phone}</Text>}
            </View>
            <View style={styles.heading_values}>
              <Text style={styles.heading}>ID:</Text>
              <Text>{p_data.nic}</Text>
            </View>
          </View>
          <View style={styles.upper_right}>
            <View style={styles.heading_values}>
              <Text style={styles.heading}>Date:</Text>
              <Text>{formatDate(report?.createdAt || p_data.updatedAt)}</Text>
            </View>
            {report?.diagnosys?.BMI && 
              <View style={styles.heading_values}>
                <Text style={styles.heading}>BMI:</Text>
                <Text>{report?.diagnosys?.BMI} kg/m²</Text>
              </View>
            }
            {report?.diagnosys?.Weight && 
              <View style={styles.heading_values}>
                <Text style={styles.heading}>Weight:</Text>
                <Text>{report?.diagnosys?.Weight} kg</Text>
              </View>
            }
          </View>
        </View>
        <View style={styles.pData}>
          <View style={styles.gravida_vitals}>
            <View style={styles.gravida_section}>
              { report?.Gravida  && <View style={styles.heading_values}>
                <Text style={styles.heading}>G</Text>
                <Text>{report.Gravida}</Text>
                <Text style={styles.heading}>P</Text>
                <Text>{report.Parity}</Text>
              </View>}
              {report?.LMP && <View style={styles.heading_values}>
                <Text style={styles.heading}>LMP:</Text>
                <Text>{formatDate(report.LMP)}</Text>
              </View>}
              {report?.EDD && <View style={styles.heading_values}>
                <Text style={styles.heading}>EDD:</Text>
                <Text>{formatDate(report.EDD)}</Text>
              </View>}
              {report?.POG && <View style={styles.heading_values}>
                <Text style={styles.heading}>POG:</Text>
                <Text>{report.POG}</Text>
              </View>}
              {report?.LCB && <View style={styles.heading_values}>
                <Text style={styles.heading}>LCB:</Text>
                <Text>{report.LCB}</Text>
              </View>}
              {report?.MOD && <View style={styles.heading_values}>
                <Text style={styles.heading}>MOD:</Text>
                <Text>{report.MOD}</Text>
              </View>}
            </View>

            <View style={styles.vitals_section}>
              {report?.diagnosys?.BP && <View style={styles.heading_values}>
                <Text style={styles.heading}>BP:</Text>
                <Text>{report?.diagnosys?.BP} mm of Hg</Text>
              </View>}
              {report?.diagnosys?.PR && <View style={styles.heading_values}>
                <Text style={styles.heading}>PR:</Text>
                <Text>{report?.diagnosys?.PR} bpm</Text>
              </View>}
              {report?.diagnosys?.SPO2 && <View style={styles.heading_values}>
                <Text style={styles.heading}>SPO2:</Text>
                <Text>{report?.diagnosys?.SPO2}% in RA</Text>
              </View>}
              {report?.diagnosys?.Temp && <View style={styles.heading_values}>
                <Text style={styles.heading}>Temp:</Text>
                <Text>{report?.diagnosys?.Temp}°F</Text>
              </View>}
              {report?.diagnosys?.Others && <View style={styles.heading_values}>
                <Text style={styles.heading}>Others:</Text>
                <Text>{report?.diagnosys?.Others}</Text>
              </View>}
            </View>
          </View>

          <View style={styles.onExamination}>
            {report?.presentingComplaints &&<View style={[styles.heading_values, {marginBottom: "2mm"}]}>
              <Text style={styles.heading}>Presenting Complaints:</Text>
              <Text>{report?.presentingComplaints
                        ? report.presentingComplaints.slice(
                            report.presentingComplaints.length - 1,
                            report.presentingComplaints.length
                          ) === ","
                        ? report.presentingComplaints.slice(
                              0,
                            report.presentingComplaints.length - 1
                            )
                        : report.presentingComplaints
                        : ""}
              </Text>
            </View>}
            {report?.medicalHistory && <View style={[styles.heading_values, {marginBottom: "2mm"}]}>
              <Text style={styles.heading}>Medical History:</Text>
              <Text>
                {report?.medicalHistory
                        ? report.medicalHistory.slice(
                            report.medicalHistory.length - 1,
                            report.medicalHistory.length
                          ) === ","
                        ? report.medicalHistory.slice(
                              0,
                            report.medicalHistory.length - 1
                            )
                        : report.medicalHistory
                        : ""}
              </Text>
            </View>}
            {report?.clinical_findings && <View style={{marginBottom: "2mm"}}>
              <View style={styles.heading_values}>
                <Text style={styles.heading}>On Examination:</Text>
                <Text>
                  Patient is {report?.clinical_findings?.patientCondition.c1 &&
                      report?.clinical_findings?.patientCondition.c1+', '}
                      {report?.clinical_findings?.patientCondition.c2 && report?.clinical_findings?.patientCondition.c2+', '}
                      {report?.clinical_findings?.patientCondition.c3 && report?.clinical_findings?.patientCondition.c3+', '}
                      {report?.clinical_findings?.patientCondition.c4 && report?.clinical_findings?.patientCondition.c4+'.'}
                </Text>
              </View>
              <View style={[styles.heading_values, {flexWrap: "wrap"}]}>
                {report?.clinical_findings?.polar && <Text>{`Polar-${report?.clinical_findings?.polar}, `}</Text>}
                {report?.clinical_findings?.icterus && <Text>{`Icterus-${report?.clinical_findings?.icterus}, `}</Text>}
                {report?.clinical_findings?.edema && <Text>{`Edema-${report?.clinical_findings?.edema}, `}</Text>}
                {report?.clinical_findings?.cyanosis && <Text>{`Cyanosis-${report?.clinical_findings?.cyanosis}, `}</Text>}
                {report?.clinical_findings?.clubbing && <Text>{`Clubbing-${report?.clinical_findings?.clubbing}, `}</Text>}
                {report?.clinical_findings?.lymph_nodes && <Text>{`Lymph Nodes-${report?.clinical_findings?.lymph_nodes}`}</Text>}
              </View>
              <View style={styles.heading_values}>
                {report?.clinical_findings?.chest && <Text>{`Chest-${report?.clinical_findings?.chest}, `}</Text>}
                {report?.clinical_findings?.cvs && <Text>{`CVS-${report?.clinical_findings?.cvs}, `}</Text>}
                {report?.clinical_findings?.per_abdomen.pt && <Text>{`Per Abdomen-${report?.clinical_findings?.per_abdomen.pt},`}</Text>}
                {report?.clinical_findings?.per_abdomen.pv && <Text>{`${report?.clinical_findings?.per_abdomen.pv}`}</Text>}
              </View>
              {report?.clinical_findings?.others && <Text>Others- {report?.clinical_findings?.others}</Text>}
            </View>}

            {report?.advice?.testAdvice?.length > 0 && 
            <View style={[styles.heading_values, {marginBottom: "2mm", flexWrap: "wrap"}]}>
              <Text style={styles.heading}>Investigations:</Text>
              {report.advice.testAdvice.map((t, i) => (
                 <Text key={i}>
                    {t.testName}
                    {report.advice.testAdvice.length - 1 !== i && ", "}
                </Text>
                ))}
            </View>}
            <View style={styles.heading_values}>
              <Text style={styles.heading}>
                {report?.diagnosys_heading ? report.diagnosys_heading : "Provisional Diagnosis"}:
              </Text>
              <Text>
                {report?.initialComplain?.
                  slice(report.initialComplain.length - 1, report.initialComplain.length) === "," 
                  ? report.initialComplain.slice(0, report.initialComplain.length - 1) : report?.initialComplain}
              </Text>
            </View>
          </View>
        </View>

        <Image style={styles.rxLogo} src="/Rx_logo.png"/>
        <View style={styles.med_advice}>
          <View style={styles.medic_header}>
            <Text style={{width:"6%"}}>SN</Text>
            <Text style={{width:"10%"}}>Type</Text>
            <Text style={{width:"34%"}}>Medicine</Text>
            <Text style={{width:"10%"}}>Dose</Text>
            <Text style={{width:"15%"}}>Route</Text>
            <Text style={{width:"15%"}}>Frequency</Text>
            <Text style={{width:"10%"}}>Duration</Text>
          </View>
          {report?.medicineAdvice?.map((med, index) => (
            index < 15 && 
              <View key={index} style={styles.medic_row}>
                <Text style={{width:"6%"}}>{index + 1}</Text>
                <Text style={{width:"10%"}}>{med.type}</Text>
                <Text style={{width:"34%"}}>{med.name}</Text>
                <Text style={{width:"10%"}}>{med.dose}</Text>
                <Text style={{width:"15%"}}>{med.route}</Text>
                <Text style={{width:"15%"}}>{med.frequency}</Text>
                <Text style={{width:"10%"}}>{med.duration}</Text>
              </View>
          ))}
        </View>
      </View>

      {report?.medicineAdvice?.length >= 15 &&
      <View style={styles.main_section} break>
        <View style={[styles.upper_box, {marginBottom:"10mm"}]}>
          <View style={styles.upper_left}>
            <View style={styles.personal_details}>
              <Text style={styles.heading}>{p_data.name},</Text>
              <Text>{p_data.gender},</Text>
              <Text>{p_data.dob? dobToAge(p_data.dob): p_data.age? `${p_data.age} years`: ""}</Text>
              { p_data.phone && <Text>,+91{p_data.phone}</Text>}
            </View>
            <View style={styles.heading_values}>
              <Text style={styles.heading}>ID:</Text>
              <Text>{p_data.nic}</Text>
            </View>
          </View>
          <View style={styles.upper_right}>
            <View style={styles.heading_values}>
              <Text style={styles.heading}>Date:</Text>
              <Text>{formatDate(report?.createdAt || p_data.updatedAt)}</Text>
            </View>
            {report?.diagnosys?.BMI && 
              <View style={styles.heading_values}>
                <Text style={styles.heading}>BMI:</Text>
                <Text>{report?.diagnosys?.BMI} kg/m²</Text>
              </View>
            }
            {report?.diagnosys?.Weight && 
              <View style={styles.heading_values}>
                <Text style={styles.heading}>Weight:</Text>
                <Text>{report?.diagnosys?.Weight} kg</Text>
              </View>
            }
          </View>
        </View>

        <View style={styles.med_advice} >
          <View style={styles.medic_header}>
            <Text style={{width:"6%"}}>SN</Text>
            <Text style={{width:"10%"}}>Type</Text>
            <Text style={{width:"34%"}}>Medicine</Text>
            <Text style={{width:"10%"}}>Dose</Text>
            <Text style={{width:"15%"}}>Route</Text>
            <Text style={{width:"15%"}}>Frequency</Text>
            <Text style={{width:"10%"}}>Duration</Text>
          </View>
          {report?.medicineAdvice?.slice(15).map((med, index) => (
            <View key={index} style={styles.medic_row}>
              <Text style={{width:"6%"}}>{index + 16}</Text>
              <Text style={{width:"10%"}}>{med.type}</Text>
              <Text style={{width:"34%"}}>{med.name}</Text>
              <Text style={{width:"10%"}}>{med.dose}</Text>
              <Text style={{width:"15%"}}>{med.route}</Text>
              <Text style={{width:"15%"}}>{med.frequency}</Text>
              <Text style={{width:"10%"}}>{med.duration}</Text>
            </View>
          ))}
        </View>
      </View>
      }
      <View style={styles.seal} fixed>
        <View style={styles.seal_left}>
          {report?.additionalAdvice && <View style={styles.heading_values}>
            <Text style={styles.heading}>Advice:</Text>
            <Text>{report.additionalAdvice}</Text>
          </View>}
          {report?.followUp && <View style={styles.heading_values}>
            <Text style={styles.heading}>Follo-up Date:</Text>
            <Text>{formatDate(report.followUp)}</Text>
          </View>}
        </View>
        <View style={styles.seal_right}>
          <Text style={styles.heading}>
            {dr_data? `Dr. ${dr_data.firstName || ""} ${dr_data.lastName || ""}`: ""}
          </Text>
        </View>
      </View>

      <View style={styles.footer_section} fixed>
        <Image style={styles.footer_image} src="/G.Jakaria_footer1.png" />
      </View>
    </Page>
  </Document>
);
};

export default MyDocument;
