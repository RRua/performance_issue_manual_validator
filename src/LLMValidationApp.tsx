import React, { useState, useEffect } from 'react';
import { AlertCircle, FolderArchive, Bug, Tag,  MessageCircleQuestion, CheckCircle, XCircle, FileText, Code, GitBranch, MessageSquare, Save, List } from 'lucide-react';

const LLMValidationApp = () => {
  const [data, setData] = useState([]);
  //const [dataLoaded, setDataLoaded] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [example1, setExample1] = useState('');
  const [example2, setExample2] = useState('');
  const [gitDiff, setGitDiff] = useState('');
  const [issueData, setIssueData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [userValidations, setUserValidations] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [expandedSections, setExpandedSections] = useState(['llm_info']);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  useEffect(() => {
    console.log("ai bai");
    fetch('http://127.0.0.1:5000/get_issues_specification')
      .then(response => response.json())
      .then(issueData => {
        setIssueData(issueData.content);
      })
      .catch(error => {
        console.error('Error loading mockData:', error);
        setLoadingData(false);
      });

    fetch('http://127.0.0.1:5000/get_true_positives')
      .then(response => response.json())
      .then(mockData => {
        setData(mockData.content);
        setPendingItems([...Array(mockData.content.length).keys()]); // Índices de todos os itens
        setLoadingData(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoadingData(false);
      });
    

  }, []);

    const toggleSection = (section) => {
        if (expandedSections.includes(section)) {
        // Remove the section from the array if it's already expanded
        setExpandedSections(expandedSections.filter((s) => s !== section));
        } else {
        // Add the section to the array if it's not expanded
        setExpandedSections([...expandedSections, section]);
        }
  };

  const handleValidation = (verdict) => {
    // Obter o item atual
    const currentItem = data[pendingItems[currentIndex]];
    cleanCurrIssueInfo();
    
    // Adicionar à lista de validações com o veredicto do usuário
    const newValidation = {
      ...currentItem,
      userVerdict: verdict,
      csvLine: `${currentItem.originalCsvLine};${verdict}`
    };
    
    setUserValidations([...userValidations, newValidation]);
    

    saveClassified(verdict);
    
    // Remover da lista pendente e atualizar o índice
    const newPendingItems = [...pendingItems];
    newPendingItems.splice(currentIndex, 1);
    setPendingItems(newPendingItems);
    
    // Manter o mesmo índice (que agora apontará para o próximo item)
    // a menos que estejamos no final da lista
    if (currentIndex >= newPendingItems.length) {
      setCurrentIndex(Math.max(0, newPendingItems.length - 1));
    }
    
    // Mostrar notificação
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
  };

  const cleanCurrIssueInfo = () => {
    setFileContent('');
    setGitDiff('');
    setExample1('');
    setExample2('');
    setExpandedSections(['llm_info']);
    }

  // Função para exportar todas as validações para CSV
  const exportAllToCSV = () => {
    // Construir o conteúdo do CSV
    const csvContent = userValidations.map(item => item.csvLine).join('\n');
    
    // Na implementação real, isso salvaria em um arquivo
    console.log("Exportando todas as validações para CSV:");
    console.log(csvContent);
    
    // Criar e fazer download do arquivo (apenas funciona no navegador)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'validation_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchFileContent = async (currentItem) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/get_issue_file_remote?repo_dir=${encodeURIComponent(currentItem.repo_dir)}&curr_commit=${encodeURIComponent(currentItem.fix_commit_hash)}&prev_commit=${encodeURIComponent(currentItem.prev_commit_hash)}&issue_file=${encodeURIComponent(currentItem.issue_location.split('|')[0])}&issue_name=${encodeURIComponent(currentItem.issue_name)}`
      );
      setLoadingData(true);
  
      const result = await response.json();
      console.log(result);
      if (result.status === "success") {
        setFileContent(result.content); // Store the file content in state
      } else {
        console.error("Error fetching file content:", result.message);
        setFileContent(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      setFileContent(`Error: ${error.message}`);
    } 
    finally {
        setLoadingData(false);
    }
  };

  const fetchGitDiff = async (currentItem) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/get_git_diff_remote?repo_dir=${encodeURIComponent(currentItem.repo_dir)}&prev_commit=${encodeURIComponent(currentItem.prev_commit_hash)}&curr_commit=${encodeURIComponent(currentItem.fix_commit_hash)}&issue_file=${encodeURIComponent(currentItem.issue_location.split('|')[0])}&issue_name=${encodeURIComponent(currentItem.issue_name)}`
      );
      setLoadingData(true);
  
      const result = await response.json();
      console.log(result);
      if (result.status === "success") {
        setGitDiff(result.content); // Store the git diff in state
      } else {
        console.error("Error fetching git diff:", result.message);
        setGitDiff(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching git diff:", error);
      setGitDiff(`Error: ${error.message}`);
    } 
    finally {
        setLoadingData(false);
    }
  };

  const fetchExampleFile = async (example_file) => {
    try {
        console.log("Fetching example file:", example_file);
        const batata = issueData[currentItem.issue_name];
        console.log("Current item:", currentItem);
        var example = batata[example_file];
        console.log("Example file:", example);
        const response = await fetch(
            `http://127.0.0.1:5000/get_example_file?example_filename=${example}`
        );
        setLoadingData(true);
    
      const result = await response.json();
      console.log(result);
      if (result.status === "success") {
        if (example_file === "example_1") {
          setExample1(result.content); // Store the example file content in state
        } else if (example_file === "example_2") {
            setExample2(result.content); // Store the example file content in state
        }
      } else {
        console.error("Error fetching example file:", result.message);
      }
    } catch (error) {
      console.error("Error fetching example file", error);
    } 
    finally {
        setLoadingData(false);
    }
  };

  const saveClassified = async (classification, filePath = "true_positives_validated.csv") => {
    try {
      const response = await fetch('http://127.0.0.1:5000/save_classified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue_data: currentItem,
          classification: classification,
        }),
      });
  
      const result = await response.json();
  
      if (result.status === "success") {
        console.log("Data saved successfully:", result.message);
      } else {
        console.error("Error saving data:", result.message);
      }
    } catch (error) {
      console.error("Error saving classified data:", error);
    }
  };

  // Se não houver mais itens pendentes
  if (pendingItems.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold">Manual validation tool for labeling Issue Regressions on Android Projects</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Classification process Concluded!</h2>
          <p className="text-gray-600 mb-6">You have classified {userValidations.length} items</p>
          
          <button
            onClick={exportAllToCSV}
            className="py-3 px-6 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Save size={20} />
            <span>Export Results (CSV)</span>
          </button>
        </div>
      </div>
    );
  }

  // Se ainda temos itens pendentes
  const currentItem = pendingItems.length > 0 ? data[pendingItems[currentIndex]] : null;

  if (loadingData || !currentItem) {
    return <div className="flex items-center justify-center h-screen">Carregando dados...</div>;
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-3 shadow-md">
          <div>
            <h1 className="text-2xl font-bold">Manual validation tool for labeling Issue Regressions on Android Projects</h1>
            <p className="pt-1 text-sm text-left opacity-80">
              {pendingItems.length} itens left to classify
            </p>
          </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar/Navigation */}
        <div className="w-86 bg-gray-200 overflow-y-auto border-r">
          <div className="p-4 font-bold border-b flex items-center justify-between">
            <span>Pending Issues</span>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              {pendingItems.length}
            </span>
          </div>
          {pendingItems.length > 0 ? (
            <ul>
              {pendingItems.map((dataIndex, i) => (
                <li 
                  key={dataIndex}
                  className={`border-b p-3 cursor-pointer transition ${currentIndex === i ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  onClick={() => {setCurrentIndex(i); cleanCurrIssueInfo();}}
                >
                  <div className="flex items-center justify-between">
                    <span>{i + 1}. {data[dataIndex].issue_name}</span>
                  </div>
                  <div className="text-xs text-left text-gray-900 truncate">{data[dataIndex].repo_dir.split('/').pop()}</div>
                  <div className="text-xs text-left text-gray-500 truncate">{data[dataIndex].issue_location.split('/').pop()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-gray-500 text-center">No pending issues</div>
          )}
          
          {userValidations.length > 0 && (
            <>
              <div className="p-4 font-bold border-b border-t flex items-center justify-between mt-4">
                <span>Classified</span>
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                  {userValidations.length}
                </span>
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {userValidations.map((item, i) => (
                  <li 
                    key={i}
                    className="border-b p-3 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.pattern}</span>
                      {item.userVerdict === 'true_positive' ? 
                        <CheckCircle size={16} className="text-green-500" /> : 
                        <XCircle size={16} className="text-red-500" />
                      }
                    </div>
                    <div className="text-xs text-gray-500 truncate">{item.issue_location.split('/').pop()}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Notification de salvamento */}
          {showSaveNotification && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in-out">
              <CheckCircle size={20} />
              <span>Item classificado e salvo!</span>
            </div>
          )}
          
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4 mb-6">
              {/* New section */}
              <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleSection('issue_details')}
                >
                  <div className="flex items-center">
                    <Bug size={18} className="mr-2" />
                    <span className="font-bold text-2xl">Issue: {currentItem.issue_name}</span>
                  </div>
                  <span>{expandedSections.includes('issue_details') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('issue_details') && (
                    <div>
                        <div className="mb-3">
                            <h2 className="text-lg font-semibold mb-2">Problem Description</h2>
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                            <div className="flex items-start">
                                <AlertCircle size={20} className="text-red-500 mr-2 mt-1" />
                                <p className="text-gray-800 text-left">{issueData[currentItem.issue_name].description}</p>
                            </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <h2 className="text-lg font-semibold mb-2">Suggested fix</h2>
                            <div className="p-4 bg-green-100 border rounded-lg">
                            <div className="flex items-start">
                                <CheckCircle size={20} className="text-green-500 mr-2 mt-1" />
                                <p className="text-gray-800 text-left">{issueData[currentItem.issue_name].expected_fix}</p>
                            </div>
                            </div>
                        </div>
                        <div className="flex items-center  justify-evenly">
                            <div className="flex flex-col mr-4 flex-1">
                                {expandedSections.includes('example1') && (
                                <div className="p-4 bg-gray-900 text-white font-mono text-sm overflow-x-auto">
                                    <pre className='text-left'>{example1}</pre>
                                </div>
                                )}
                                <button
                                    onClick={() => {toggleSection('example1'); fetchExampleFile("example_1");}}
                                    className="flex-1 p-4 bg-blue-100 hover:bg-green-200 rounded-lg flex justify-center items-center"
                                >
                                    <span>Example 1</span>
                                </button>
                            </div>
                            <div className="flex flex-col flex-1">
                                {expandedSections.includes('example2') && (
                                <div className="p-4 bg-gray-900 text-white font-mono text-sm overflow-x-auto">
                                    <pre className='text-left'>{example2}</pre>
                                </div>
                                )}
                                <button
                                    onClick={() => {toggleSection('example2'); fetchExampleFile("example_2");}}
                                    className="flex-1 p-3 bg-blue-100  hover:bg-green-200 rounded-lg flex justify-center items-center"
                                >
                                    <span>Example 2</span>
                                </button>
                            </div>
                           
                            
                        </div>
                        
                    </div>
                    
                    
                )}
              </div>
            </div>

            

            <div className="space-y-4 mb-6">
            
            <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleSection('project_info')}
                >
                  <div className="flex items-center">
                    <FolderArchive size={18} className="mr-2" />
                    <span className="text-xl">Project Info: {currentItem.repo_dir.split('/').pop()}</span>
                  </div>
                  <span>{expandedSections.includes('project_info') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('project_info') && (
                  <div>
                    <div className="my-3 mx-3 flex items-center text-gray-700">
                        <FolderArchive size={18} className="mr-2" />
                        <span className="font-mono text-sm">Directory: {currentItem.repo_dir}</span>
                    </div>
                    <div className="my-3  mx-3 flex items-center text-gray-700">
                        <FileText size={18} className="mr-2" />
                        <span className="font-mono text-sm">File: {currentItem.issue_location.split("|")[0]}</span>
                    </div>
                    <div className="my-3  mx-3 flex items-center text-gray-700">
                        <Code size={18} className="mr-2" />
                        <span className="font-mono text-sm">Location: {currentItem.issue_location}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Code Diff Section */}
              <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => {toggleSection('codeDiff'); if(!expandedSections.includes('codeDiff')) fetchGitDiff(currentItem);}}
                >
                  <div className="flex items-center">
                    <GitBranch size={18} className="mr-2" />
                    <span className="font-medium">Git diff</span>
                  </div>
                  <span>{expandedSections.includes('codeDiff') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('codeDiff') && (
                  <div className="p-4 bg-gray-900 text-white font-mono text-sm overflow-x-auto">
                    <pre className="text-left">{gitDiff}</pre>
                  </div>
                )}
              </div>

              {/* File Content Section */}
              <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => {toggleSection('fileContent'); if(!expandedSections.includes('fileContent')) fetchFileContent(currentItem);}}
                >
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2" />
                    <span className="font-medium">File content</span>
                  </div>
                  <span>{expandedSections.includes('fileContent') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('fileContent') && (
                  <div className="p-4 bg-gray-900 text-white font-mono text-sm overflow-x-auto">
                    <pre className="text-left">{fileContent}</pre>
                  </div>
                )}
              </div>

              {/* Commit Information */}
              <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleSection('commitInfo')}
                >
                  <div className="flex items-center">
                    <MessageSquare size={18} className="mr-2" />
                    <span className="font-medium">Commit Info</span>
                  </div>
                  <span>{ expandedSections.includes('commitInfo') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('commitInfo') && (
                  <div className="p-4">
                    <div className="space-y-2 text-left">
                        <div className='flex items-center'>
                            <span className="font-semibold">Message:</span>
                            <div className="px-2">{currentItem.commit_message ? currentItem.commit_message : 'None'}</div>
                        </div>
                      <div className='flex items-center'>
                        <span className="font-semibold">Detected on:</span>
                        <div className="px-2">
                          {currentItem.prev_commit_hash}
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <span className="font-semibold">Solved on:</span>
                        <div className="px-2">
                          {currentItem.fix_commit_hash}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <button 
                  className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleSection('llm_info')}
                >
                  <div className="flex items-center">
                    <Tag size={18} className="mr-2" />
                    <span className="text-xl">LLM Validation Info</span>
                  </div>
                  <span>{expandedSections.includes('llm_info') ? '−' : '+'}</span>
                </button>
                
                {expandedSections.includes('llm_info') && (
                  <div className='p-3'>
                <div className="mt-2 flex items-center text-gray-700">
                    <Tag size={18} className="mr-2" />
                    <span className="font-mono text-sm">Pre-label: {currentItem.pre_label}</span>
                </div>
                <div className="mt-2 flex items-center text-gray-700">
                    <FileText size={18} className="mr-2" />
                    <span className="font-mono text-sm">File exists: {(currentItem.pre_label != "file_removed").toString()}</span>
                </div>
                <div className="mt-2 flex items-center text-gray-700">
                    <Code size={18} className="mr-2" />
                    <span className="font-mono text-sm">Diff submitted: {currentItem.sub_git_diff}</span>
                </div>
                <div className="mt-2 flex items-center text-gray-700">
                    <Code size={18} className="mr-2" />
                    <span className="font-mono text-sm">File content submitted: {currentItem.sub_file_ctnt}</span>
                </div>
                  </div>
                )}
              </div>

            {/* Validation Section */}
            <div className="border-t pt-6">
                <div className="flex items-center justify-center text-lg py-4 bg-orange-100 rounded-lg font-semibold mb-4">
                    <Tag size={20} className="mr-2" />
                    <span className="text-xl">LLM Label: {currentItem.llm_label}</span>
                </div>
                <h3 className="text-lg font-semibold mb-4">Your verdict</h3>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={() => {handleValidation('real_unknown');}}
                        className="flex-1 py-3 bg-orange-400 text-green-900 hover:bg-red-200 rounded-lg flex justify-center items-center space-x-2"
                        >
                        <MessageCircleQuestion size={20} />
                        <span>Unknown</span>
                    </button>
                    <button
                        onClick={() => {handleValidation('real_false_positive');}}
                        className="flex-1 py-3 bg-red-500 text-green-900 hover:bg-red-200 rounded-lg flex justify-center items-center space-x-2"
                        >
                        <XCircle size={20} />
                        <span>False Positive</span>
                    </button>
                    <button
                        onClick={() => {handleValidation('real_true_positive');}}
                        className="flex-1 py-3 bg-green-500 text-green-900 hover:bg-green-200 rounded-lg flex justify-center items-center space-x-2"
                        >
                        <CheckCircle size={20} />
                        <span>True Positive</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Navigation Controls */}
      <footer className="bg-white p-2 border-t flex justify-between items-center">
        
        <button 
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-lg ${currentIndex === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
        >
          Previous
        </button>
        
        <div>
          <span className="font-medium">{currentIndex + 1}</span>
          <span className="text-gray-500"> of {pendingItems.length}</span>
        </div>
        
        <button 
          onClick={() => setCurrentIndex(Math.min(pendingItems.length - 1, currentIndex + 1))}
          disabled={currentIndex === pendingItems.length - 1}
          className={`px-4 py-2 rounded-lg ${currentIndex === pendingItems.length - 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
        >
          Next
        </button>
      </footer>
    </div>
  );
};

export default LLMValidationApp;
