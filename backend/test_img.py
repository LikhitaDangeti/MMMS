import openpyxl
wb = openpyxl.load_workbook(r'..\template\MillShiftCheckList.xlsx')
print(wb["Sheet1"]._images)
