import openpyxl

wb = openpyxl.load_workbook(r'..\template\MillShiftCheckList.xlsx')
sid = 1

for sn in wb.sheetnames:
    if sn != f"Sheet{sid}":
        del wb[sn]

# Important: set the active sheet to the only remaining sheet so Excel opens it properly
wb.active = wb.worksheets[0]

wb.save('test_del_out3.xlsx')
